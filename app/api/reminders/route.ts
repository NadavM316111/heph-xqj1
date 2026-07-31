import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "../../../lib/db";

const prefix = () => process.env.APP_TABLE_PREFIX ?? "app";

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ ok: false, error: "No DB" }, { status: 503 });
  try {
    await ensure();
    const body = await req.json();
    const {
      userEmail, selectedSchools, emailEnabled, smsEnabled,
      phone, reminder30, reminder7, reminder1
    } = body;

    if (!userEmail) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    // Upsert reminders
    await q(
      `INSERT INTO ${prefix()}_reminders (user_email, email_enabled, sms_enabled, phone, reminder_30, reminder_7, reminder_1)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_email) DO UPDATE SET
         email_enabled = EXCLUDED.email_enabled,
         sms_enabled = EXCLUDED.sms_enabled,
         phone = EXCLUDED.phone,
         reminder_30 = EXCLUDED.reminder_30,
         reminder_7 = EXCLUDED.reminder_7,
         reminder_1 = EXCLUDED.reminder_1`,
      [userEmail, emailEnabled, smsEnabled, phone || null, reminder30, reminder7, reminder1]
    );

    // Sync schools
    if (Array.isArray(selectedSchools)) {
      await q(`DELETE FROM ${prefix()}_schools WHERE user_email = $1`, [userEmail]);
      for (const collegeId of selectedSchools) {
        await q(
          `INSERT INTO ${prefix()}_schools (user_email, college_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userEmail, collegeId]
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ ok: false, error: "No DB" }, { status: 503 });
  try {
    await ensure();
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("email");
    if (!userEmail) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const reminders = await q(
      `SELECT * FROM ${prefix()}_reminders WHERE user_email = $1`,
      [userEmail]
    );
    const schools = await q(
      `SELECT college_id FROM ${prefix()}_schools WHERE user_email = $1`,
      [userEmail]
    );

    return NextResponse.json({
      ok: true,
      reminders: reminders[0] ?? null,
      schools: schools.map((s: { college_id: string }) => s.college_id),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}