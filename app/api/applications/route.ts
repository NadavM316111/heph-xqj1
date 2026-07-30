import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

async function setupTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_applications (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_name TEXT NOT NULL,
      college_id TEXT,
      deadline_date DATE NOT NULL,
      deadline_type TEXT NOT NULL DEFAULT 'regular_decision',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ applications: [] });
  }
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  try {
    await setupTable();
    const rows = await q(
      "SELECT id, college_name, college_id, deadline_date::text, deadline_type, notes, created_at FROM edutracker_applications WHERE user_email = $1 ORDER BY deadline_date ASC",
      [email]
    );
    return NextResponse.json({ applications: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }
  const body = await req.json();
  const { email, college_name, college_id, deadline_date, deadline_type, notes } = body;
  if (!email || !college_name || !deadline_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    await setupTable();
    const rows = await q(
      "INSERT INTO edutracker_applications (user_email, college_name, college_id, deadline_date, deadline_type, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [email, college_name, college_id || null, deadline_date, deadline_type || "regular_decision", notes || ""]
    );
    return NextResponse.json({ id: rows[0]?.id, ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }
  const body = await req.json();
  const { id, email } = body;
  if (!id || !email) return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
  try {
    await setupTable();
    await q(
      "DELETE FROM edutracker_applications WHERE id = $1 AND user_email = $2",
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}