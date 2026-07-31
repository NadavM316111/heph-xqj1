import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ deadlines: [] });
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  await ensure();
  const rows = await q("SELECT * FROM deadlines WHERE user_email = $1 ORDER BY deadline_date ASC", [email]);
  return NextResponse.json({ deadlines: rows });
}

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "no db" }, { status: 500 });
  const body = await req.json();
  const { email, college_id, college_name, deadline_type, deadline_date, notes } = body;
  if (!email || !college_name || !deadline_type || !deadline_date) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  await ensure();
  const rows = await q(
    "INSERT INTO deadlines (user_email, college_id, college_name, deadline_type, deadline_date, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [email, college_id || "", college_name, deadline_type, deadline_date, notes || ""]
  );
  return NextResponse.json({ deadline: rows[0] });
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "no db" }, { status: 500 });
  const id = req.nextUrl.searchParams.get("id");
  const email = req.nextUrl.searchParams.get("email");
  if (!id || !email) return NextResponse.json({ error: "id and email required" }, { status: 400 });
  await ensure();
  await q("DELETE FROM deadlines WHERE id = $1 AND user_email = $2", [id, email]);
  return NextResponse.json({ ok: true });
}