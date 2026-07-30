import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "../../../lib/db";

const TABLE = `${process.env.APP_TABLE_PREFIX || "edutracker"}_tracked_schools`;

async function initTable() {
  await ensure(
    TABLE,
    `CREATE TABLE IF NOT EXISTS ${TABLE} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      college_id TEXT NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(email, college_id, deadline_type)
    )`
  );
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ schools: [] });
  }
  try {
    await initTable();
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
    const rows = await q(
      `SELECT id, college_id, college_name, deadline_type, deadline_date, notes FROM ${TABLE} WHERE email = $1 ORDER BY deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ schools: rows });
  } catch (err) {
    console.error("GET /api/schools error:", err);
    return NextResponse.json({ schools: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }
  try {
    await initTable();
    const body = await req.json();
    const { email, college_id, college_name, deadline_type, deadline_date, notes } = body;
    if (!email || !college_id || !deadline_type || !deadline_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    await q(
      `INSERT INTO ${TABLE} (email, college_id, college_name, deadline_type, deadline_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email, college_id, deadline_type) DO UPDATE
       SET college_name = EXCLUDED.college_name,
           deadline_date = EXCLUDED.deadline_date,
           notes = EXCLUDED.notes`,
      [email, college_id, college_name, deadline_type, deadline_date, notes || ""]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/schools error:", err);
    return NextResponse.json({ error: "Failed to save school" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }
  try {
    await initTable();
    const id = req.nextUrl.searchParams.get("id");
    const email = req.nextUrl.searchParams.get("email");
    if (!id || !email) return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    await q(`DELETE FROM ${TABLE} WHERE id = $1 AND email = $2`, [id, email]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/schools error:", err);
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
  }
}