import { NextRequest, NextResponse } from "next/server";
import { q, P, ensure } from "@/lib/db";

const REMINDER_DAYS = [30, 14, 7, 1];

export async function GET(req: NextRequest) {
  // Simple auth check for cron endpoint
  const authHeader = req.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensure();

    const due: { email: string; college_name: string; deadline_type: string; deadline_date: string; deadline_id: number; days_before: number; phone: string; notify_email: boolean; notify_sms: boolean }[] = [];

    for (const daysBefore of REMINDER_DAYS) {
      const rows = await q(
        `SELECT d.id as deadline_id, d.email, d.college_name, d.deadline_type, d.deadline_date::text,
                p.phone, p.notify_email, p.notify_sms
         FROM ${P}deadlines d
         LEFT JOIN ${P}profiles p ON p.email = d.email
         WHERE d.deadline_date = CURRENT_DATE + INTERVAL '${daysBefore} days'
           AND NOT EXISTS (
             SELECT 1 FROM ${P}reminders_sent rs
             WHERE rs.email = d.email AND rs.deadline_id = d.id AND rs.days_before = $1
           )`,
        [daysBefore]
      );
      for (const row of rows) {
        due.push({
          email: row.email as string,
          college_name: row.college_name as string,
          deadline_type: row.deadline_type as string,
          deadline_date: row.deadline_date as string,
          deadline_id: row.deadline_id as number,
          days_before: daysBefore,
          phone: row.phone as string,
          notify_email: (row.notify_email ?? true) as boolean,
          notify_sms: (row.notify_sms ?? false) as boolean,
        });
      }
    }

    // Mark as sent (in production you'd call an email/SMS API here)
    for (const reminder of due) {
      await q(
        `INSERT INTO ${P}reminders_sent (email, deadline_id, days_before) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [reminder.email, reminder.deadline_id, reminder.days_before]
      );
    }

    return NextResponse.json({
      processed: due.length,
      reminders: due.map(r => ({
        email: r.email,
        college: r.college_name,
        type: r.deadline_type,
        date: r.deadline_date,
        days_before: r.days_before,
        channels: [r.notify_email && "email", r.notify_sms && r.phone && "sms"].filter(Boolean),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}