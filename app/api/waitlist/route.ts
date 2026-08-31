import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PreviewStore = {
  positions: Map<string, number>;
  referrals: Map<string, number>;
  qualifiers: Map<string, { targetLanguage?: string; currentMethod?: string; previousFrustration?: string }>;
};

declare global {
  var theLingoPreviewStore: PreviewStore | undefined;
}

const previewStore =
  globalThis.theLingoPreviewStore ??
  (globalThis.theLingoPreviewStore = {
    positions: new Map<string, number>(),
    referrals: new Map<string, number>(),
    qualifiers: new Map<string, { targetLanguage?: string; currentMethod?: string; previousFrustration?: string }>(),
  });

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function referralCode(email: string) {
  return createHash("sha256").update(email).digest("base64url").slice(0, 9).toLowerCase();
}

async function sendResendConfirmation(email: string, targetLanguage?: string, referralCodeStr?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const fromEmail = process.env.RESEND_FROM_EMAIL || "TheLingo Placement <onboarding@resend.dev>";
  const lang = targetLanguage || "Spanish";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Your ${lang} Placement Spot is Reserved | TheLingo`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #101114;">
            <h2 style="font-size: 24px; font-weight: 900;">Your ${lang} placement spot is reserved.</h2>
            <p>We will deliver your initial placement match invitation directly when your language cohort opens.</p>
            <p>Your referral link: <strong>https://thelingo.app/waitlist?ref=${referralCodeStr}</strong></p>
            <p style="color: #666; font-size: 13px;">Share your link with study partners to jump ahead by 10 spots for each referral.</p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("Resend email delivery failed:", err);
  }
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

async function redis(command: Array<string | number>) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("The waitlist store could not be reached.");
  const payload = (await response.json()) as { result: unknown };
  return payload.result;
}

async function joinPersistentWaitlist(
  email: string,
  referringCode?: string,
  qualifier?: { targetLanguage?: string; currentMethod?: string; previousFrustration?: string },
) {
  const initialCount = Number(process.env.WAITLIST_INITIAL_COUNT ?? 0);
  const code = referralCode(email);
  const emailKey = `thelingo:email:${createHash("sha256").update(email).digest("hex")}`;
  const added = Number(await redis(["SETNX", emailKey, code]));

  let signupNumber: number;
  if (added === 1) {
    signupNumber = initialCount + Number(await redis(["INCR", "thelingo:signup-count"]));
    await redis(["HSET", "thelingo:positions", code, signupNumber]);
    if (referringCode && referringCode !== code) {
      await redis(["HINCRBY", "thelingo:referrals", referringCode, 1]);
    }
  } else {
    signupNumber = Number(await redis(["HGET", "thelingo:positions", code]));
  }

  if (qualifier && Object.keys(qualifier).length > 0) {
    await redis(["HSET", `thelingo:qualifier:${code}`, "data", JSON.stringify(qualifier)]);
  }

  const referralWins = Number((await redis(["HGET", "thelingo:referrals", code])) ?? 0);
  return { signupNumber, position: Math.max(1, signupNumber - referralWins * 10), code };
}

function joinPreviewWaitlist(
  email: string,
  referringCode?: string,
  qualifier?: { targetLanguage?: string; currentMethod?: string; previousFrustration?: string },
) {
  const initialCount = Number(process.env.WAITLIST_INITIAL_COUNT ?? 8);
  const code = referralCode(email);
  let signupNumber = previewStore.positions.get(code);

  if (!signupNumber) {
    signupNumber = initialCount + previewStore.positions.size + 1;
    previewStore.positions.set(code, signupNumber);
    if (referringCode && referringCode !== code) {
      previewStore.referrals.set(
        referringCode,
        (previewStore.referrals.get(referringCode) ?? 0) + 1,
      );
    }
  }

  if (qualifier && Object.keys(qualifier).length > 0) {
    previewStore.qualifiers.set(code, qualifier);
  }

  const referralWins = previewStore.referrals.get(code) ?? 0;
  return { signupNumber, position: Math.max(1, signupNumber - referralWins * 10), code };
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

    const qualifier = {
      targetLanguage: body.targetLanguage?.trim(),
      currentMethod: body.currentMethod?.trim(),
      previousFrustration: body.previousFrustration?.trim(),
    };

    const hasPersistentStore = Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
    );
    const result = hasPersistentStore
      ? await joinPersistentWaitlist(email, body.ref, qualifier)
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

    // Trigger async handlers (Resend email, Webhook, Disk backup)
    await saveToLocalDiskStore(record);
    await triggerWebhook(record);
    await sendResendConfirmation(email, qualifier.targetLanguage, result.code);

    return NextResponse.json({
      ok: true,
      signupNumber: result.signupNumber,
      position: result.position,
      referralCode: result.code,
      revealPosition: result.signupNumber >= 10,
      previewMode: !hasPersistentStore,
    });
  } catch {
    return NextResponse.json(
      { error: "Your spot could not be saved right now. Please try again." },
      { status: 500 },
    );
  }
}
