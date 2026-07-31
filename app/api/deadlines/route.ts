import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "../../../lib/db";

const TABLE = `${process.env.APP_TABLE_PREFIX ?? "edu"}_deadlines`;

async function initTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ deadlines: [] });
  }
  try {
    await initTable();
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    const rows = await q(
      `SELECT id, college_name, deadline_type, deadline_date::text, notes
       FROM ${TABLE}
       WHERE email = $1
       ORDER BY deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ deadlines: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }
  try {
    await initTable();
    const body = await req.json();
    const { email, college_name, deadline_type, deadline_date, notes } = body;
    if (!email || !college_name || !deadline_type || !deadline_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const rows = await q(
      `INSERT INTO ${TABLE} (email, college_name, deadline_type, deadline_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [email, college_name, deadline_type, deadline_date, notes ?? ""]
    );
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }
  try {
    await initTable();
    const body = await req.json();
    const { id, email } = body;
    if (!id || !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }
    await q(
      `DELETE FROM ${TABLE} WHERE id = $1 AND email = $2`,
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}