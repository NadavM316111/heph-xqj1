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
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ colleges: [] });
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  try {
    await ensureTables();
    const rows = await q(
      `SELECT id, name, location, added_at FROM ${T}colleges WHERE user_email = $1 ORDER BY name ASC`,
      [email]
    );
    return NextResponse.json({ colleges: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 503 });
  const body = await req.json();
  const { email, name, location } = body;
  if (!email || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  try {
    await ensureTables();
    const rows = await q(
      `INSERT INTO ${T}colleges (user_email, name, location) VALUES ($1, $2, $3)
       ON CONFLICT (user_email, name) DO UPDATE SET location = EXCLUDED.location
       RETURNING id, name, location, added_at`,
      [email, name, location || ""]
    );
    return NextResponse.json({ college: rows[0] });
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
    // Also delete associated deadlines
    await q(
      `DELETE FROM ${T}deadlines WHERE college_id = $1 AND user_email = $2`,
      [parseInt(id), email]
    );
    await q(
      `DELETE FROM ${T}colleges WHERE id = $1 AND user_email = $2`,
      [parseInt(id), email]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}