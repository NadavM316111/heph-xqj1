import { NextRequest, NextResponse } from "next/server";
import { q, ensureTable, P, hasDb } from "@/lib/db";

const ensureDeadlineStatus = () =>
  ensureTable(
    "CREATE TABLE IF NOT EXISTS " + P + "_deadline_status (" +
    "id SERIAL PRIMARY KEY," +
    "user_email TEXT NOT NULL," +
    "college_id INTEGER NOT NULL," +
    "deadline_type TEXT NOT NULL," +
    "deadline_date TEXT NOT NULL," +
    "completed BOOLEAN NOT NULL DEFAULT false," +
    "updated_at TIMESTAMPTZ DEFAULT now()," +
    "UNIQUE (user_email, college_id, deadline_type, deadline_date)" +
    ")"
  );

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ statuses: [] });
  if (!hasDb()) return NextResponse.json({ statuses: [] });
  try {
    await ensureDeadlineStatus();
    const rows = await q(
      `SELECT college_id, deadline_type, deadline_date, completed
       FROM ${P}_deadline_status WHERE user_email = $1`,
      [email]
    );
    return NextResponse.json({ statuses: rows });
  } catch {
    return NextResponse.json({ statuses: [] });
  }
}

export async function POST(req: NextRequest) {
  const { email, collegeId, deadlineType, deadlineDate, completed } = await req.json();
  if (!email) return NextResponse.json({ ok: false });
  if (!hasDb()) return NextResponse.json({ ok: false });
  try {
    await ensureDeadlineStatus();
    await q(
      `INSERT INTO ${P}_deadline_status (user_email, college_id, deadline_type, deadline_date, completed, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_email, college_id, deadline_type, deadline_date)
       DO UPDATE SET completed = $5, updated_at = NOW()`,
      [email, collegeId, deadlineType, deadlineDate, completed]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}