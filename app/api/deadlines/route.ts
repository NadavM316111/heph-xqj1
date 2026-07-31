import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "../../../lib/db";

const T = (process.env.APP_TABLE_PREFIX || "et") + "_";

async function ensureTables() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${T}colleges (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT DEFAULT '',
      added_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_email, name)
    )
  `);
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${T}deadlines (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_id INTEGER NOT NULL REFERENCES ${T}colleges(id) ON DELETE CASCADE,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_email, college_id, deadline_type)
    )
  `);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ deadlines: [] });
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  try {
    await ensureTables();
    const rows = await q(
      `SELECT d.id, d.college_id, c.name AS college_name, c.location AS college_location,
              d.deadline_type, d.deadline_date::text, d.notes
       FROM ${T}deadlines d
       JOIN ${T}colleges c ON c.id = d.college_id
       WHERE d.user_email = $1
       ORDER BY d.deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ deadlines: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 503 });
  const body = await req.json();
  const { email, college_id, deadline_type, deadline_date, notes } = body;
  if (!email || !college_id || !deadline_type || !deadline_date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  try {
    await ensureTables();
    const rows = await q(
      `INSERT INTO ${T}deadlines (user_email, college_id, deadline_type, deadline_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_email, college_id, deadline_type)
       DO UPDATE SET deadline_date = EXCLUDED.deadline_date, notes = EXCLUDED.notes
       RETURNING id, college_id, deadline_type, deadline_date::text, notes`,
      [email, college_id, deadline_type, deadline_date, notes || ""]
    );
    return NextResponse.json({ deadline: rows[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 503 });
  const id = req.nextUrl.searchParams.get("id");
  const email = req.nextUrl.searchParams.get("email");
  if (!id || !email) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  try {
    await ensureTables();
    await q(
      `DELETE FROM ${T}deadlines WHERE id = $1 AND user_email = $2`,
      [parseInt(id), email]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}