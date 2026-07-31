import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function init() {
  await ensure();
  await q(`
    CREATE TABLE IF NOT EXISTS edutracker_deadlines (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_name TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      app_type TEXT NOT NULL DEFAULT 'Regular Decision',
      status TEXT NOT NULL DEFAULT 'Not Started',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `, []);
}

export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await init();
  const rows = await q("SELECT * FROM edutracker_deadlines WHERE user_email = $1 ORDER BY deadline_date ASC", [email]);
  return NextResponse.json({ deadlines: rows.rows });
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await init();
  const body = await req.json();
  const { school_name, deadline_date, app_type, status, notes } = body;
  if (!school_name || !deadline_date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const row = await q(
    "INSERT INTO edutracker_deadlines (user_email, school_name, deadline_date, app_type, status, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [email, school_name, deadline_date, app_type || "Regular Decision", status || "Not Started", notes || ""]
  );
  return NextResponse.json({ deadline: row.rows[0] });
}

export async function PUT(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await init();
  const body = await req.json();
  const { id, school_name, deadline_date, app_type, status, notes } = body;
  if (!id || !school_name || !deadline_date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const row = await q(
    "UPDATE edutracker_deadlines SET school_name=$1, deadline_date=$2, app_type=$3, status=$4, notes=$5 WHERE id=$6 AND user_email=$7 RETURNING *",
    [school_name, deadline_date, app_type, status, notes || "", id, email]
  );
  return NextResponse.json({ deadline: row.rows[0] });
}

export async function DELETE(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await init();
  const body = await req.json();
  const { id } = body;
  await q("DELETE FROM edutracker_deadlines WHERE id=$1 AND user_email=$2", [id, email]);
  return NextResponse.json({ ok: true });
}