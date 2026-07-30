import { NextRequest, NextResponse } from "next/server";
import { q, P, ensure } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  try {
    await ensure();
    const rows = await q(`SELECT email, phone, notify_email, notify_sms FROM ${P}profiles WHERE email = $1`, [email]);
    return NextResponse.json({ profile: rows[0] || null });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone = "", notify_email = true, notify_sms = false } = body;
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
    await ensure();
    await q(
      `INSERT INTO ${P}profiles (email, phone, notify_email, notify_sms)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET phone = EXCLUDED.phone, notify_email = EXCLUDED.notify_email, notify_sms = EXCLUDED.notify_sms, updated_at = NOW()`,
      [email, phone, notify_email, notify_sms]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}