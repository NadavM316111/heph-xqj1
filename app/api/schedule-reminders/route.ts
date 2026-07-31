import { NextRequest, NextResponse } from "next/server";
import { q, P, ensure } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, reminderSettings, deadlines } = body;

    if (!email || !deadlines) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await ensure();

    // Ensure the reminders table exists
    await q(`
      CREATE TABLE IF NOT EXISTS ${P}edutracker_reminders (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        reminder_email TEXT,
        phone TEXT,
        sms_enabled BOOLEAN DEFAULT false,
        college_name TEXT NOT NULL,
        deadline_type TEXT NOT NULL,
        deadline_date DATE NOT NULL,
        deadline_label TEXT,
        days_before INTEGER NOT NULL,
        scheduled_date DATE NOT NULL,
        sent BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(email, college_name, deadline_type, deadline_date, days_before)
      )
    `);

    const intervals: number[] = reminderSettings?.intervals ?? [30, 14, 7, 1];
    const reminderEmail: string = reminderSettings?.email || email;
    const phone: string = reminderSettings?.phone || "";
    const smsEnabled: boolean = reminderSettings?.smsEnabled || false;

    // Insert scheduled reminders
    let inserted = 0;
    for (const deadline of deadlines) {
      const deadlineDate = new Date(deadline.deadlineDate);
      if (isNaN(deadlineDate.getTime())) continue;

      const now = new Date();
      if (deadlineDate < now) continue;

      for (const daysBefore of intervals) {
        const scheduledDate = new Date(deadlineDate);
        scheduledDate.setDate(scheduledDate.getDate() - daysBefore);

        if (scheduledDate < now) continue;

        await q(
          `INSERT INTO ${P}edutracker_reminders
           (email, reminder_email, phone, sms_enabled, college_name, deadline_type, deadline_date, deadline_label, days_before, scheduled_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (email, college_name, deadline_type, deadline_date, days_before) DO UPDATE
           SET reminder_email = EXCLUDED.reminder_email,
               phone = EXCLUDED.phone,
               sms_enabled = EXCLUDED.sms_enabled,
               scheduled_date = EXCLUDED.scheduled_date,
               sent = false`,
          [
            email,
            reminderEmail,
            phone,
            smsEnabled,
            deadline.collegeName,
            deadline.deadlineType,
            deadline.deadlineDate,
            deadline.label,
            daysBefore,
            scheduledDate.toISOString().split("T")[0],
          ]
        );
        inserted++;
      }
    }

    return NextResponse.json({ ok: true, scheduled: inserted });
  } catch (err) {
    console.error("POST /api/schedule-reminders error:", err);
    return NextResponse.json({ error: "Failed to schedule reminders" }, { status: 500 });
  }
}