import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

const PREFIX = process.env.APP_TABLE_PREFIX ?? "app";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ statuses: [] });
  if (!hasDb()) return NextResponse.json({ statuses: [] });
  try {
    await ensure();
    const rows = await q(
      `SELECT college_id, deadline_type, deadline_date, completed
       FROM ${PREFIX}_deadline_status WHERE user_email = $1`,
      [email]
    );
    return NextResponse.json({ statuses: rows });
  } catch {
    return NextResponse.json({ statuses: [] });
  }
}

export async function POST(req: NextRequest) {
  const { email, collegeId, deadlineType, deadlineDate, completed } = await req.json();
  if (!email) return NextResponse.json({ ok: false });
  if (!hasDb()) return NextResponse.json({ ok: false });
  try {
    await ensure();
    await q(
      `INSERT INTO ${PREFIX}_deadline_status (user_email, college_id, deadline_type, deadline_date, completed, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_email, college_id, deadline_type, deadline_date)
       DO UPDATE SET completed = $5, updated_at = NOW()`,
      [email, collegeId, deadlineType, deadlineDate, completed]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}