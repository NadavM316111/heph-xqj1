import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

async function setupTable() {
  if (!hasDb()) return;
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_deadlines (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  if (!hasDb()) return NextResponse.json({ deadlines: [] });

  try {
    await setupTable();
    const rows = await q(
      "SELECT id, college_name, deadline_type, deadline_date::text, notes FROM edutracker_deadlines WHERE user_email = $1 ORDER BY deadline_date ASC",
      [email]
    );
    return NextResponse.json({ deadlines: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, college_name, deadline_type, deadline_date, notes } = body;

  if (!email || !college_name || !deadline_type || !deadline_date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }

  try {
    await setupTable();
    const rows = await q(
      "INSERT INTO edutracker_deadlines (user_email, college_name, deadline_type, deadline_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [email, college_name, deadline_type, deadline_date, notes || ""]
    );
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const email = req.nextUrl.searchParams.get("email");

  if (!id || !email) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  if (!hasDb()) return NextResponse.json({ error: "No database configured" }, { status: 503 });

  try {
    await q(
      "DELETE FROM edutracker_deadlines WHERE id = $1 AND user_email = $2",
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}