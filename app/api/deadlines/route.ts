import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

async function initTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS __APP__deadlines (
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
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  try {
    await initTable();
    const rows = await q(
      "SELECT id, college_name, deadline_type, deadline_date::text, notes, created_at FROM __APP__deadlines WHERE email = $1 ORDER BY deadline_date ASC",
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
    return NextResponse.json({ ok: false, error: "No database configured" }, { status: 503 });
  }
  const body = await req.json();
  const { email, college_name, deadline_type, deadline_date, notes } = body;
  if (!email || !college_name || !deadline_type || !deadline_date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  try {
    await initTable();
    await q(
      "INSERT INTO __APP__deadlines (email, college_name, deadline_type, deadline_date, notes) VALUES ($1, $2, $3, $4, $5)",
      [email, college_name, deadline_type, deadline_date, notes || ""]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ ok: false, error: "No database configured" }, { status: 503 });
  }
  const body = await req.json();
  const { id, email, college_name, deadline_type, deadline_date, notes } = body;
  if (!id || !email || !college_name || !deadline_type || !deadline_date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  try {
    await initTable();
    await q(
      "UPDATE __APP__deadlines SET college_name = $1, deadline_type = $2, deadline_date = $3, notes = $4 WHERE id = $5 AND email = $6",
      [college_name, deadline_type, deadline_date, notes || "", id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ ok: false, error: "No database configured" }, { status: 503 });
  }
  const body = await req.json();
  const { id, email } = body;
  if (!id || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  try {
    await initTable();
    await q("DELETE FROM __APP__deadlines WHERE id = $1 AND email = $2", [id, email]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}