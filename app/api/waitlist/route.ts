import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { sendConfirmationEmail, sendReferralJumpEmail } from "@/lib/email";
import { getTier } from "@/lib/tiers";
import { getInitialCount } from "@/lib/waitlist-count";

export const runtime = "nodejs";

type Qualifier = { targetLanguage?: string; currentMethod?: string; previousFrustration?: string };

type JoinResult = {
  signupNumber: number;
  position: number;
  code: string;
  isNew: boolean;
  referrerNotify: { email: string; targetLanguage?: string; previousPosition: number; newPosition: number } | null;
};

type PreviewStore = {
  positions: Map<string, number>;
  referrals: Map<string, number>;
  qualifiers: Map<string, Qualifier>;
  order: string[];
};

declare global {
  var theLingoPreviewStore: PreviewStore | undefined;
}

const previewStore =
  globalThis.theLingoPreviewStore ??
  (globalThis.theLingoPreviewStore = {
    positions: new Map<string, number>(),
    referrals: new Map<string, number>(),
    qualifiers: new Map<string, Qualifier>(),
    order: [],
  });

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function referralCode(email: string) {
  return createHash("sha256").update(email).digest("base64url").slice(0, 9).toLowerCase();
}

async function triggerWebhook(data: Record<string, unknown>) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Webhook trigger failed:", err);
  }
}

async function saveToLocalDiskStore(record: Record<string, unknown>) {
  // Vercel's deployment filesystem is read-only outside /tmp, so mkdir here
  // throws EROFS on EVERY signup in production. It was caught and logged, so
  // signups still succeeded, but it buried a guaranteed error in the logs on
  // the one code path where a real failure most needs to be visible.
  // Postgres is the system of record; this file is only a local dev safety net.
  if (process.env.VERCEL) return;

  try {
    const dataDir = path.join(process.cwd(), ".data");
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "waitlist.json");

    let existing: Array<Record<string, unknown>> = [];
    try {
      const content = await fs.readFile(filePath, "utf-8");
      existing = JSON.parse(content);
    } catch {
      existing = [];
    }

    existing.push(record);
    await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");
  } catch (err) {
    console.error("Local disk storage backup failed:", err);
  }
}

async function joinPostgresWaitlist(
  email: string,
  referringCode: string | undefined,
  qualifier: Qualifier,
): Promise<JoinResult> {
  const sql = await getDb();
  const initialCount = getInitialCount();
  const code = referralCode(email);
  const validReferredBy = referringCode && referringCode !== code ? referringCode : null;

  const inserted = await sql`
    INSERT INTO waitlist_entries (email, referral_code, referred_by, target_language, current_method, previous_frustration)
    VALUES (${email}, ${code}, ${validReferredBy}, ${qualifier.targetLanguage ?? null}, ${qualifier.currentMethod ?? null}, ${qualifier.previousFrustration ?? null})
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `;

  let id: number;
  let isNew: boolean;
  if (inserted.length > 0) {
    id = inserted[0].id as number;
    isNew = true;
  } else {
    const existing = await sql`SELECT id FROM waitlist_entries WHERE email = ${email}`;
    if (existing.length === 0) throw new Error("Row vanished between insert and read.");
    id = existing[0].id as number;
    isNew = false;
    // Their language choice would otherwise be silently discarded on a repeat
    // submit, leaving the confirmation email describing the OLD language.
    await sql`
      UPDATE waitlist_entries
      SET target_language = COALESCE(${qualifier.targetLanguage ?? null}, target_language),
          current_method = COALESCE(${qualifier.currentMethod ?? null}, current_method),
          previous_frustration = COALESCE(${qualifier.previousFrustration ?? null}, previous_frustration)
      WHERE id = ${id}
    `;
  }

  // Rank is this row's ORDINAL position, not its raw serial id.
  // `INSERT ... ON CONFLICT DO NOTHING` still consumes the sequence, so ids
  // develop gaps (currently 2 rows but sequence at 13). Using the raw id made
  // rank outrun the public headcount: the site said "39 people on the waitlist"
  // while telling someone they were "#42 in line". Counting rows at or before
  // this one keeps rank and total derived from the same fact, so the newest
  // signup is always exactly the last position.
  const ordinalRows = await sql`
    SELECT COUNT(*)::int AS n FROM waitlist_entries WHERE id <= ${id}
  `;
  const ordinal = (ordinalRows[0].n as number) ?? 1;
  const signupNumber = initialCount + ordinal;
  const referralWinsRows = await sql`SELECT COUNT(*)::int AS count FROM waitlist_entries WHERE referred_by = ${code}`;
  const referralWins = referralWinsRows[0].count as number;
  const position = Math.max(1, signupNumber - referralWins * 10);

  let referrerNotify: JoinResult["referrerNotify"] = null;
  if (isNew && validReferredBy) {
    const referrerRows = await sql`
      SELECT id, email, target_language FROM waitlist_entries WHERE referral_code = ${validReferredBy}
    `;
    if (referrerRows.length > 0) {
      const referrer = referrerRows[0] as { id: number; email: string; target_language: string | null };
      // Same ordinal basis as above, otherwise the referrer's "you moved up"
      // email quotes a position that does not exist on the site.
      const referrerOrdinalRows = await sql`
        SELECT COUNT(*)::int AS n FROM waitlist_entries WHERE id <= ${referrer.id}
      `;
      const referrerSignupNumber = initialCount + ((referrerOrdinalRows[0].n as number) ?? 1);
      // Referral counts *before* this signup vs. after, to know how far they jumped.
      const referrerWinsBeforeRows = await sql`
        SELECT COUNT(*)::int AS count FROM waitlist_entries
        WHERE referred_by = ${validReferredBy} AND id < ${id}
      `;
      const winsBefore = referrerWinsBeforeRows[0].count as number;
      const previousPosition = Math.max(1, referrerSignupNumber - winsBefore * 10);
      const newPosition = Math.max(1, referrerSignupNumber - (winsBefore + 1) * 10);
      referrerNotify = {
        email: referrer.email,
        targetLanguage: referrer.target_language ?? undefined,
        previousPosition,
        newPosition,
      };
    }
  }

  return { signupNumber, position, code, isNew, referrerNotify };
}

function joinPreviewWaitlist(email: string, referringCode: string | undefined, qualifier: Qualifier): JoinResult {
  const initialCount = getInitialCount();
  const code = referralCode(email);
  let signupNumber = previewStore.positions.get(code);
  let isNew = false;

  if (!signupNumber) {
    isNew = true;
    signupNumber = initialCount + previewStore.positions.size + 1;
    previewStore.positions.set(code, signupNumber);
    previewStore.order.push(code);
    if (referringCode && referringCode !== code) {
      previewStore.referrals.set(referringCode, (previewStore.referrals.get(referringCode) ?? 0) + 1);
    }
  }

  if (qualifier && Object.keys(qualifier).length > 0) {
    previewStore.qualifiers.set(code, qualifier);
  }

  const referralWins = previewStore.referrals.get(code) ?? 0;
  const position = Math.max(1, signupNumber - referralWins * 10);

  let referrerNotify: JoinResult["referrerNotify"] = null;
  if (isNew && referringCode && referringCode !== code && previewStore.positions.has(referringCode)) {
    const referrerSignupNumber = previewStore.positions.get(referringCode)!;
    const winsAfter = previewStore.referrals.get(referringCode) ?? 0;
    const previousPosition = Math.max(1, referrerSignupNumber - (winsAfter - 1) * 10);
    const newPosition = Math.max(1, referrerSignupNumber - winsAfter * 10);
    referrerNotify = {
      email: "", // No email store in memory-only preview mode.
      previousPosition,
      newPosition,
    };
  }

  return { signupNumber, position, code, isNew, referrerNotify };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      ref?: string;
      targetLanguage?: string;
      currentMethod?: string;
      previousFrustration?: string;
    };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!emailPattern.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Enter a real email address so we can deliver your placement match." },
        { status: 400 },
      );
    }

    // Allowlist, not sanitize. `targetLanguage` is interpolated unescaped into
    // the confirmation email's subject AND html (lib/email.ts:75-77). This route
    // is public and unauthenticated, so a free-text value let anyone have Resend
    // deliver attacker-authored markup from the verified thelingo.xyz sender.
    // Anything unrecognized falls back to the default rather than being echoed.
    const ALLOWED_LANGUAGES = [
      "Spanish", "French", "Japanese", "German",
      "Italian", "Mandarin", "Portuguese", "Another language",
    ];
    const requestedLanguage = body.targetLanguage?.trim();
    const safeLanguage = ALLOWED_LANGUAGES.includes(requestedLanguage ?? "")
      ? requestedLanguage
      : undefined;

    // Free-text qualifiers are never emailed, but they do hit unbounded TEXT
    // columns on a public endpoint. Cap them.
    const cap = (v: string | undefined) => v?.trim().slice(0, 200);

    const qualifier: Qualifier = {
      targetLanguage: safeLanguage,
      currentMethod: cap(body.currentMethod),
      previousFrustration: cap(body.previousFrustration),
    };

    const hasPersistentStore = isDatabaseConfigured();
    const result = hasPersistentStore
      ? await joinPostgresWaitlist(email, body.ref, qualifier)
      : joinPreviewWaitlist(email, body.ref, qualifier);

    const record = {
      email,
      position: result.position,
      signupNumber: result.signupNumber,
      referralCode: result.code,
      referredBy: body.ref ?? null,
      targetLanguage: qualifier.targetLanguage ?? "Spanish",
      currentMethod: qualifier.currentMethod ?? null,
      previousFrustration: qualifier.previousFrustration ?? null,
      createdAt: new Date().toISOString(),
    };

    await saveToLocalDiskStore(record);
    await triggerWebhook(record);

    if (result.isNew) {
      await sendConfirmationEmail({
        email,
        targetLanguage: qualifier.targetLanguage,
        referralCode: result.code,
        position: result.position,
      });

      if (result.referrerNotify && result.referrerNotify.email) {
        await sendReferralJumpEmail({
          email: result.referrerNotify.email,
          targetLanguage: result.referrerNotify.targetLanguage,
          previousPosition: result.referrerNotify.previousPosition,
          newPosition: result.referrerNotify.newPosition,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      // The hero counter needs this: a repeat submit must not bump the total.
      isNew: result.isNew,
      signupNumber: result.signupNumber,
      position: result.position,
      referralCode: result.code,
      revealPosition: result.signupNumber >= 10,
      previewMode: !hasPersistentStore,
      tier: getTier(result.position),
    });
  } catch (err) {
    console.error("Waitlist signup failed:", err);
    return NextResponse.json(
      { error: "Your spot could not be saved right now. Please try again." },
      { status: 500 },
    );
  }
}
