import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
const client = url ? neon(url) : null;

export const P = (process.env.APP_TABLE_PREFIX || "heph_app").replace(/[^a-z0-9_]/g, "");

export function hasDb(): boolean {
  return !!client;
}

export async function q(text: string, params: any[] = []): Promise<any[]> {
  if (!client) return [];
  const parts = text.split(/\$\d+/);
  const strings: any = [...parts];
  strings.raw = [...parts];
  return (await (client as any)(strings, ...params)) as any[];
}

let ready = false;

/** The tables every app has. Takes no arguments. */
export async function ensure(): Promise<void> {
  if (!client || ready) return;
  await q("CREATE TABLE IF NOT EXISTS " + P + "_users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, pass TEXT NOT NULL, paid BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now())");
  await q("ALTER TABLE " + P + "_users ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false");
  await q("CREATE TABLE IF NOT EXISTS " + P + "_visits (id SERIAL PRIMARY KEY, path TEXT, at TIMESTAMPTZ DEFAULT now())");
  ready = true;
}

const made = new Set<string>();

/**
 * Create one of YOUR tables. Pass a full CREATE TABLE IF NOT EXISTS statement.
 * Safe to call at the top of every request: it only touches the database once
 * per statement per server instance.
 *
 *   await ensureTable(\`CREATE TABLE IF NOT EXISTS \${P}_alerts (
 *     id SERIAL PRIMARY KEY,
 *     owner_email TEXT NOT NULL,
 *     body TEXT,
 *     created_at TIMESTAMPTZ DEFAULT now()
 *   )\`);
 */
export async function ensureTable(createSql: string): Promise<void> {
  if (!client) return;
  const key = createSql.replace(/\s+/g, " ").trim();
  if (made.has(key)) return;
  await q(createSql);
  made.add(key);
}
