import { NextRequest, NextResponse } from "next/server";
import { q, P, ensureTable } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = P + "_alerts";

async function setup() {
  await ensureTable(
    `CREATE TABLE IF NOT EXISTS ${TABLE} (id SERIAL PRIMARY KEY, owner_email TEXT NOT NULL, note TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`
  );
}

export async function GET(req: NextRequest) {
  await setup();
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await q(`SELECT * FROM ${TABLE} WHERE owner_email = $1 ORDER BY created_at DESC`, [email]);
  return NextResponse.json({ alerts: rows.rows });
}

export async function POST(req: NextRequest) {
  await setup();
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { note } = await req.json();
  if (!note || !note.trim()) return NextResponse.json({ error: "Note is required." }, { status: 400 });
  const result = await q(
    `INSERT INTO ${TABLE} (owner_email, note) VALUES ($1, $2) RETURNING *`,
    [email, note.trim()]
  );
  return NextResponse.json({ alert: result.rows[0] });
}

export async function DELETE(req: NextRequest) {
  await setup();
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await q(`DELETE FROM ${TABLE} WHERE id = $1 AND owner_email = $2`, [id, email]);
  return NextResponse.json({ ok: true });
}