import { NextRequest, NextResponse } from "next/server";
import { q, P, ensure } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  try {
    await ensure();
    const rows = await q(
      `SELECT selected_colleges, reminders FROM ${P}edutracker_users WHERE email = $1`,
      [email]
    );
    if (rows.length === 0) {
      return NextResponse.json({ selectedColleges: [], reminders: null });
    }
    return NextResponse.json({
      selectedColleges: rows[0].selected_colleges ?? [],
      reminders: rows[0].reminders ?? null,
    });
  } catch (err) {
    console.error("GET /api/user-data error:", err);
    return NextResponse.json({ selectedColleges: [], reminders: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, selectedColleges, reminders } = body;
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    await ensure();
    await q(
      `INSERT INTO ${P}edutracker_users (email, selected_colleges, reminders, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email) DO UPDATE
       SET selected_colleges = EXCLUDED.selected_colleges,
           reminders = EXCLUDED.reminders,
           updated_at = NOW()`,
      [email, selectedColleges ?? [], JSON.stringify(reminders ?? {})]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/user-data error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}