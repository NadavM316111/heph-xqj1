import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";

// This endpoint is meant to be called by a cron job daily.
// It checks which reminders need to be sent today and logs them.
// In production, integrate with an email provider.

async function ensureTable() {
  await ensure();
  await q(`
    CREATE TABLE IF NOT EXISTS et_reminder_log (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      deadline_id INTEGER NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      reminder_type TEXT NOT NULL,
      sent_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []);
}

export async function GET(req: NextRequest) {
  // Simple auth check via secret header for cron
  const auth = req.headers.get("x-cron-secret");
  if (auth !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensure();
    await ensureTable();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const intervals = [
      { days: 30, field: "reminder_30", label: "30-day" },
      { days: 14, field: "reminder_14", label: "14-day" },
      { days: 7, field: "reminder_7", label: "7-day" },
      { days: 1, field: "reminder_1", label: "1-day" },
    ];

    const remindersToSend = [];

    for (const interval of intervals) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + interval.days);
      const dateStr = targetDate.toISOString().split("T")[0];

      const result = await q(
        `SELECT d.*, d.user_email
         FROM et_user_deadlines d
         WHERE d.deadline_date = $1
         AND d.${interval.field} = TRUE`,
        [dateStr]
      );

      for (const row of result.rows as Array<{
        id: number;
        user_email: string;
        college_name: string;
        deadline_type: string;
        deadline_date: string;
      }>) {
        // Check if already sent
        const alreadySent = await q(
          `SELECT id FROM et_reminder_log WHERE deadline_id = $1 AND reminder_type = $2`,
          [row.id, interval.label]
        );
        if (alreadySent.rows.length === 0) {
          // Log the reminder
          await q(
            `INSERT INTO et_reminder_log (user_email, deadline_id, college_name, deadline_type, deadline_date, reminder_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [row.user_email, row.id, row.college_name, row.deadline_type, row.deadline_date, interval.label]
          );
          remindersToSend.push({
            email: row.user_email,
            college: row.college_name,
            type: row.deadline_type,
            date: row.deadline_date,
            reminderType: interval.label,
            daysUntil: interval.days,
          });
        }
      }
    }

    return NextResponse.json({ sent: remindersToSend.length, reminders: remindersToSend });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}