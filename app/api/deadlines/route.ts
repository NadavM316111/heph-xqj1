import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = `${process.env.APP_TABLE_PREFIX || "edutracker"}_deadlines`;

async function setupTable() {
  await ensure(TABLE, `
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ error: "no database" }, { status: 500 });
  }

  await setupTable();

  const rows = await q(
    `SELECT * FROM ${TABLE} WHERE user_email = $1 ORDER BY deadline_date ASC`,
    [email]
  );

  return NextResponse.json({ ok: true, deadlines: rows.rows });
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ error: "no database" }, { status: 500 });
  }

  await setupTable();

  const body = await req.json();
  const { school_name, deadline_type, deadline_date, notes } = body;

  if (!school_name || !deadline_type || !deadline_date) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  const result = await q(
    `INSERT INTO ${TABLE} (user_email, school_name, deadline_type, deadline_date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, school_name, deadline_type, deadline_date, notes || ""]
  );

  return NextResponse.json({ ok: true, deadline: result.rows[0] });
}

export async function DELETE(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ error: "no database" }, { status: 500 });
  }

  await setupTable();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  await q(
    `DELETE FROM ${TABLE} WHERE id = $1 AND user_email = $2`,
    [id, email]
  );

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ error: "no database" }, { status: 500 });
  }

  await setupTable();

  const body = await req.json();
  const { id, school_name, deadline_type, deadline_date, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const result = await q(
    `UPDATE ${TABLE}
     SET school_name = $1, deadline_type = $2, deadline_date = $3, notes = $4
     WHERE id = $5 AND user_email = $6
     RETURNING *`,
    [school_name, deadline_type, deadline_date, notes || "", id, email]
  );

  return NextResponse.json({ ok: true, deadline: result.rows[0] });
}