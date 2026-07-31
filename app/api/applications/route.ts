import { NextResponse, NextRequest } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

const PREFIX = process.env.APP_TABLE_PREFIX ?? "edutracker";
const TABLE = `${PREFIX}_applications`;

async function ensureTable() {
  if (!hasDb()) return;
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_id TEXT NOT NULL,
      school_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'not_started',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_email, school_id, deadline_type)
    )
  `);
}

export async function GET(req: NextRequest) {
  const authRes = await fetch(new URL("/api/auth", req.url), {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const authData = await authRes.json();
  const email = authData.email as string;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ applications: [] });
  }

  await ensureTable();
  const rows = await q(`SELECT * FROM ${TABLE} WHERE user_email = $1 ORDER BY deadline_date ASC`, [email]);
  return NextResponse.json({ applications: rows.rows ?? [] });
}

export async function POST(req: NextRequest) {
  const authRes = await fetch(new URL("/api/auth", req.url), {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const authData = await authRes.json();
  const email = authData.email as string;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 500 });
  }

  await ensureTable();

  const body = await req.json();
  const { school_id, school_name, deadline_type, deadline_date, notes, status } = body;

  if (!school_id || !school_name || !deadline_type || !deadline_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await q(
    `INSERT INTO ${TABLE} (user_email, school_id, school_name, deadline_type, deadline_date, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_email, school_id, deadline_type) DO UPDATE
     SET school_name = EXCLUDED.school_name,
         deadline_date = EXCLUDED.deadline_date,
         notes = EXCLUDED.notes,
         status = EXCLUDED.status
     RETURNING *`,
    [email, school_id, school_name, deadline_type, deadline_date, notes ?? "", status ?? "not_started"]
  );

  return NextResponse.json({ application: result.rows[0] });
}

export async function DELETE(req: NextRequest) {
  const authRes = await fetch(new URL("/api/auth", req.url), {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const authData = await authRes.json();
  const email = authData.email as string;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 500 });
  }

  await ensureTable();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Only delete rows that belong to this user
  await q(`DELETE FROM ${TABLE} WHERE id = $1 AND user_email = $2`, [id, email]);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const authRes = await fetch(new URL("/api/auth", req.url), {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const authData = await authRes.json();
  const email = authData.email as string;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 500 });
  }

  await ensureTable();

  const body = await req.json();
  const { id, notes, status } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Only update rows that belong to this user
  const result = await q(
    `UPDATE ${TABLE} SET notes = COALESCE($1, notes), status = COALESCE($2, status)
     WHERE id = $3 AND user_email = $4
     RETURNING *`,
    [notes ?? null, status ?? null, id, email]
  );

  return NextResponse.json({ application: result.rows[0] });
}