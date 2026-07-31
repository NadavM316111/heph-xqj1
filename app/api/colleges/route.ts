import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { cookies } from "next/headers";

const TABLE = `${process.env.APP_TABLE_PREFIX || "edu"}_colleges`;
const SESSIONS_TABLE = `${process.env.APP_TABLE_PREFIX || "edu"}_sessions`;

async function ensureTable() {
  await ensure(
    `CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_name TEXT NOT NULL,
      deadline DATE NOT NULL,
      app_type TEXT NOT NULL DEFAULT 'Regular Decision',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
}

async function getUserEmail(request: NextRequest): Promise<string | null> {
  if (!hasDb()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    const rows = await q(`SELECT email FROM ${SESSIONS_TABLE} WHERE token = $1 AND expires_at > NOW()`, [token]);
    if (rows.length === 0) return null;
    return rows[0].email as string;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!hasDb()) return NextResponse.json({ colleges: [] });
  const email = await getUserEmail(request);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTable();
    const rows = await q(
      `SELECT id, college_name, deadline::text, app_type, notes FROM ${TABLE} WHERE user_email = $1 ORDER BY deadline ASC`,
      [email]
    );
    return NextResponse.json({ colleges: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 503 });
  const email = await getUserEmail(request);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { college_name, deadline, app_type, notes } = body;

    if (!college_name || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await ensureTable();
    const rows = await q(
      `INSERT INTO ${TABLE} (user_email, college_name, deadline, app_type, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [email, college_name.trim(), deadline, app_type || "Regular Decision", notes || ""]
    );
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 503 });
  const email = await getUserEmail(request);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await ensureTable();
    await q(
      `DELETE FROM ${TABLE} WHERE id = $1 AND user_email = $2`,
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}