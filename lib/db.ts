import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  if (!sql) sql = neon(url);
  return sql;
}

async function ensureSchema() {
  const db = getSql();
  await db`
    CREATE TABLE IF NOT EXISTS waitlist_entries (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by TEXT,
      target_language TEXT,
      current_method TEXT,
      previous_frustration TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS waitlist_entries_referred_by_idx ON waitlist_entries (referred_by)`;
  await db`CREATE INDEX IF NOT EXISTS waitlist_entries_created_at_idx ON waitlist_entries (created_at)`;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getDb() {
  const db = getSql();
  if (!schemaReady) schemaReady = ensureSchema();
  await schemaReady;
  return db;
}

export type WaitlistRow = {
  id: number;
  email: string;
  referral_code: string;
  referred_by: string | null;
  target_language: string | null;
  created_at: string;
};
