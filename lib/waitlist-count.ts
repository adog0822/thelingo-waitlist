import { neon } from "@neondatabase/serverless";
import { isDatabaseConfigured } from "@/lib/db";

/**
 * Single source of truth for the waitlist counter.
 *
 * `WAITLIST_INITIAL_COUNT` is a vanity offset carried over from a real prior
 * waitlist of 37 people: the API adds it to a row's serial `id` to produce that
 * person's `signupNumber`. Because the offset and the hero used to hardcode 37
 * independently, changing the env var moved signup numbers but left the hero
 * stuck. Both now read from here.
 */
export function getInitialCount() {
  return Number(process.env.WAITLIST_INITIAL_COUNT ?? 37);
}

/**
 * Deliberately does NOT go through `lib/db.ts` `getDb()`.
 *
 * `getDb()` runs `CREATE TABLE IF NOT EXISTS` plus two `CREATE INDEX IF NOT
 * EXISTS` once per instance. That was fine when signup was the only caller, but
 * the hero now reads the count on every cold ISR revalidation of `/`, which put
 * DDL on the landing page render path. Concurrent `IF NOT EXISTS` DDL from many
 * simultaneous cold starts is a known Postgres race (`duplicate key ...
 * pg_type_typname_nsp_index`), and a launch spike is exactly when that happens.
 * Reading is a pure SELECT; it has no business bootstrapping schema.
 */
function readOnlySql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

/**
 * The public counter: offset + how many people are ACTUALLY on the list.
 *
 * `COUNT(*)`, deliberately not `MAX(id)`. They differ because
 * `INSERT ... ON CONFLICT (email) DO NOTHING` still consumes the sequence, so
 * every duplicate submit burns an id and leaves a gap. Using `MAX(id)` would
 * make this agree with `signupNumber` arithmetically, but it would publish a
 * number larger than the real membership, and it would grow every time someone
 * re-submitted an existing email. The public figure has to be true, so gaps are
 * absorbed here.
 *
 * Consequence, by design: a person's `signupNumber` (their rank, offset + their
 * own id) can exceed this total. Rank is a stable per-person identifier; this is
 * a population count. They answer different questions and are allowed to differ.
 *
 * Never throws. A database blip returns the offset rather than breaking the
 * hero: a slightly stale counter is much cheaper than a 500 on the landing page.
 */
export async function getWaitlistCount(): Promise<number> {
  const initial = getInitialCount();

  if (!isDatabaseConfigured()) {
    // Preview/local without a database. The API's in-memory store lives in a
    // different module and, on Vercel, usually a different serverless instance
    // entirely, so there is nothing reliable to read: report the offset.
    return initial;
  }

  try {
    const sql = readOnlySql();
    if (!sql) return initial;
    const rows = await sql`SELECT COUNT(*)::int AS n FROM waitlist_entries`;
    return initial + ((rows[0]?.n as number) ?? 0);
  } catch (err) {
    console.error("Waitlist count read failed:", err);
    return initial;
  }
}

/**
 * Genuinely "joined in the last N hours", available because
 * `waitlist_entries.created_at` is indexed. Not used by the hero: pre-launch it
 * returns 0 on any quiet day, which is weaker social proof than the running
 * total. Kept because it is the only query that can honestly support a
 * "new today" label.
 */
export async function getRecentSignupCount(hours = 24): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  try {
    const sql = readOnlySql();
    if (!sql) return 0;
    const rows = await sql`
      SELECT COUNT(*)::int AS count
      FROM waitlist_entries
      WHERE created_at >= now() - make_interval(hours => ${hours})
    `;
    return (rows[0]?.count as number) ?? 0;
  } catch (err) {
    console.error("Recent signup count read failed:", err);
    return 0;
  }
}
