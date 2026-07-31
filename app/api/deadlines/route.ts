import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = `${process.env.APP_TABLE_PREFIX || ""}deadlines`;

async function setupTable() {
  await ensure(TABLE, `
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    school_name TEXT NOT NULL,
    deadline_date DATE NOT NULL,
    app_type TEXT NOT NULL DEFAULT 'Regular Decision (RD)',
    notes TEXT DEFAULT '',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  `);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ ok: true, email: "", deadlines: [] });
  }
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  try {
    await setupTable();
    const rows = await q(
      `SELECT id, school_name, deadline_date::text, app_type, notes, reminder_sent, created_at FROM ${TABLE} WHERE user_email = $1 ORDER BY deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ ok: true, email, deadlines: rows });
  } catch (err) {
    console.error("GET /api/deadlines error:", err);
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ ok: false, error: "No database" }, { status: 503 });
  }
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  try {
    await setupTable();
    const body = await req.json();
    const { school_name, deadline_date, app_type, notes } = body;
    if (!school_name || !deadline_date) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    const rows = await q(
      `INSERT INTO ${TABLE} (user_email, school_name, deadline_date, app_type, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [email, school_name, deadline_date, app_type || "Regular Decision (RD)", notes || ""]
    );
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error("POST /api/deadlines error:", err);
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }
}