import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function setup() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS __APP__deadlines (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_name TEXT NOT NULL,
      app_type TEXT NOT NULL DEFAULT 'Regular Decision',
      deadline_date DATE NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'not_started',
      reminder_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await setup();
  const rows = await q(
    "SELECT * FROM __APP__deadlines WHERE user_email = $1 ORDER BY deadline_date ASC",
    [email]
  );
  return NextResponse.json({ deadlines: rows });
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await setup();
  const { college_name, app_type, deadline_date, notes, status } = await req.json();
  if (!college_name || !deadline_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const rows = await q(
    "INSERT INTO __APP__deadlines (user_email, college_name, app_type, deadline_date, notes, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [email, college_name, app_type || "Regular Decision", deadline_date, notes || "", status || "not_started"]
  );
  return NextResponse.json({ deadline: rows[0] });
}