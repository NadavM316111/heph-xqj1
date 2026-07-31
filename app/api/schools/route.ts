import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

const PREFIX = process.env.APP_TABLE_PREFIX ?? "app";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ colleges: [] });
  if (!hasDb()) return NextResponse.json({ colleges: [] });
  try {
    await ensure();
    const rows = await q(
      `SELECT college_id FROM ${PREFIX}_user_schools WHERE user_email = $1`,
      [email]
    );
    const colleges = (rows as { college_id: string }[]).map((r) => r.college_id);
    return NextResponse.json({ colleges });
  } catch {
    return NextResponse.json({ colleges: [] });
  }
}

export async function POST(req: NextRequest) {
  const { email, collegeIds } = await req.json();
  if (!email || !collegeIds) return NextResponse.json({ ok: false });
  if (!hasDb()) return NextResponse.json({ ok: false });
  try {
    await ensure();
    // Delete existing
    await q(`DELETE FROM ${PREFIX}_user_schools WHERE user_email = $1`, [email]);
    // Insert new
    for (const id of collegeIds as string[]) {
      await q(
        `INSERT INTO ${PREFIX}_user_schools (user_email, college_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [email, id]
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}