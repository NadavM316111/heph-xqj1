import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function init() {
  await ensure();
  await q(`
    CREATE TABLE IF NOT EXISTS edutracker_reminders (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL UNIQUE,
      reminder_email TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `, []);
}

export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await init();
  const rows = await q("SELECT reminder_email FROM edutracker_reminders WHERE user_email = $1", [email]);
  return NextResponse.json({ reminder_email: rows.rows[0]?.reminder_email || "" });
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await init();
  const body = await req.json();
  const { reminder_email } = body;
  if (!reminder_email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  await q(
    `INSERT INTO edutracker_reminders (user_email, reminder_email, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_email) DO UPDATE SET reminder_email = $2, updated_at = NOW()`,
    [email, reminder_email]
  );
  return NextResponse.json({ ok: true });
}