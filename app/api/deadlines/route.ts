import { NextRequest, NextResponse } from "next/server";
import { q, P, ensure } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  try {
    await ensure();
    const rows = await q(
      `SELECT id, college_id, college_name, deadline_type, deadline_date::text, notes FROM ${P}deadlines WHERE email = $1 ORDER BY deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ deadlines: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, college_id, college_name, deadline_type, deadline_date, notes = "" } = body;
    if (!email || !college_id || !deadline_type || !deadline_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    await ensure();
    await q(
      `INSERT INTO ${P}deadlines (email, college_id, college_name, deadline_type, deadline_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email, college_id, deadline_type) DO UPDATE SET deadline_date = EXCLUDED.deadline_date, college_name = EXCLUDED.college_name`,
      [email, college_id, college_name, deadline_type, deadline_date, notes]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const email = req.nextUrl.searchParams.get("email");
  if (!id || !email) return NextResponse.json({ error: "id and email required" }, { status: 400 });
  try {
    await ensure();
    await q(`DELETE FROM ${P}deadlines WHERE id = $1 AND email = $2`, [id, email]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}