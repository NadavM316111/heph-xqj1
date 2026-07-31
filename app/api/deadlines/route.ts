import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = `${process.env.APP_TABLE_PREFIX || ""}deadlines`;

async function init() {
  if (!hasDb()) return;
  await ensure(TABLE, [
    "id SERIAL PRIMARY KEY",
    "user_email TEXT NOT NULL",
    "school_name TEXT NOT NULL",
    "deadline_date TEXT NOT NULL",
    "application_type TEXT NOT NULL",
    "notes TEXT DEFAULT ''",
    "created_at TIMESTAMPTZ DEFAULT NOW()",
  ]);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  await init();

  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await q(
    `SELECT id, school_name, deadline_date, application_type, notes, created_at FROM ${TABLE} WHERE user_email = $1 ORDER BY deadline_date ASC`,
    [email]
  );

  return NextResponse.json({ ok: true, deadlines: rows.rows });
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  await init();

  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { school_name, deadline_date, application_type, notes } = body;

  if (!school_name || !deadline_date || !application_type) {
    return NextResponse.json(
      { error: "school_name, deadline_date, and application_type are required" },
      { status: 400 }
    );
  }

  const result = await q(
    `INSERT INTO ${TABLE} (user_email, school_name, deadline_date, application_type, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, school_name, deadline_date, application_type, notes, created_at`,
    [email, school_name, deadline_date, application_type, notes || ""]
  );

  return NextResponse.json({ ok: true, deadline: result.rows[0] });
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  await init();

  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await q(
    `DELETE FROM ${TABLE} WHERE id = $1 AND user_email = $2`,
    [id, email]
  );

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  await init();

  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, school_name, deadline_date, application_type, notes } = body;

  if (!id || !school_name || !deadline_date || !application_type) {
    return NextResponse.json(
      { error: "id, school_name, deadline_date, and application_type are required" },
      { status: 400 }
    );
  }

  const result = await q(
    `UPDATE ${TABLE} SET school_name = $1, deadline_date = $2, application_type = $3, notes = $4 WHERE id = $5 AND user_email = $6 RETURNING id, school_name, deadline_date, application_type, notes, created_at`,
    [school_name, deadline_date, application_type, notes || "", id, email]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deadline: result.rows[0] });
}