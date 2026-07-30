import { NextRequest, NextResponse } from "next/server";
import { ensure, q, hasDb } from "@/lib/db";

const pfx = () => process.env.APP_TABLE_PREFIX ?? "";

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ deadlines: [], colleges: [] });
  await ensure();
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "no email" }, { status: 400 });

  const colleges = await q(
    `SELECT * FROM ${pfx()}colleges WHERE user_email = $1 ORDER BY created_at ASC`,
    [email]
  );
  const deadlines = await q(
    `SELECT * FROM ${pfx()}deadlines WHERE user_email = $1 ORDER BY deadline_date ASC`,
    [email]
  );
  return NextResponse.json({ colleges, deadlines });
}

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "no db" }, { status: 503 });
  await ensure();
  const body = await req.json();
  const { action, email } = body;

  if (action === "add_college") {
    const { name, location } = body;
    const existing = await q(
      `SELECT id FROM ${pfx()}colleges WHERE user_email = $1 AND college_name = $2`,
      [email, name]
    );
    if (existing.length > 0) {
      return NextResponse.json({ college: existing[0] });
    }
    const rows = await q(
      `INSERT INTO ${pfx()}colleges (user_email, college_name, location) VALUES ($1, $2, $3) RETURNING *`,
      [email, name, location || ""]
    );
    return NextResponse.json({ college: rows[0] });
  }

  if (action === "add_deadline") {
    const { collegeId, collegeName, collegeLocation, type, date, notes } = body;
    const rows = await q(
      `INSERT INTO ${pfx()}deadlines (user_email, college_id, college_name, deadline_type, deadline_date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, collegeId, collegeName, type, date, notes || ""]
    );
    return NextResponse.json({ deadline: rows[0] });
  }

  if (action === "delete_deadline") {
    const { deadlineId } = body;
    await q(`DELETE FROM ${pfx()}deadlines WHERE id = $1 AND user_email = $2`, [deadlineId, email]);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete_college") {
    const { collegeId } = body;
    await q(`DELETE FROM ${pfx()}deadlines WHERE college_id = $1 AND user_email = $2`, [collegeId, email]);
    await q(`DELETE FROM ${pfx()}colleges WHERE id = $1 AND user_email = $2`, [collegeId, email]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}