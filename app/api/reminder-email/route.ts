import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function setupTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS __APP_reminder_prefs (
      id SERIAL PRIMARY KEY,
      user_email TEXT UNIQUE NOT NULL,
      reminder_email TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ email: "" });
  const sessionEmail = await getSessionEmail(req);
  if (!sessionEmail) return NextResponse.json({ email: "" });

  await setupTable();

  const rows = await q(
    `SELECT reminder_email FROM __APP_reminder_prefs WHERE user_email = $1`,
    [sessionEmail]
  );

  return NextResponse.json({ email: rows[0]?.reminder_email || "" });
}

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No DB" }, { status: 500 });
  const sessionEmail = await getSessionEmail(req);
  if (!sessionEmail) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await setupTable();

  const body = await req.json();
  const { email } = body;

  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  await q(
    `INSERT INTO __APP_reminder_prefs (user_email, reminder_email)
     VALUES ($1, $2)
     ON CONFLICT (user_email) DO UPDATE SET reminder_email = $2, updated_at = NOW()`,
    [sessionEmail, email]
  );

  return NextResponse.json({ ok: true });
}