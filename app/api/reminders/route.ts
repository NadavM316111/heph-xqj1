import { NextResponse } from "next/server";
import { q, hasDb } from "@/lib/db";

// This endpoint can be called by a cron job to send pending reminders.
// GET /api/reminders?secret=CRON_SECRET
export async function GET() {
  if (!hasDb()) {
    return NextResponse.json({ message: "No DB" });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Get all unsent reminders due today or earlier
    const pending = await q(
      `SELECT r.id, r.user_email, r.days_before, r.send_at,
              d.college_name, d.deadline_type, d.deadline_date::text
       FROM edutracker_reminders r
       JOIN edutracker_deadlines d ON d.id = r.deadline_id
       WHERE r.sent = false AND r.send_at <= $1
       LIMIT 100`,
      [today]
    );

    const rows = pending as Array<{
      id: number;
      user_email: string;
      days_before: number;
      send_at: string;
      college_name: string;
      deadline_type: string;
      deadline_date: string;
    }>;

    // Mark them as sent (in a real deployment, you'd email here)
    for (const row of rows) {
      await q(`UPDATE edutracker_reminders SET sent = true WHERE id = $1`, [row.id]);
      console.log(
        `REMINDER: ${row.user_email} — ${row.college_name} ${row.deadline_type} due ${row.deadline_date} (${row.days_before} days before)`
      );
    }

    return NextResponse.json({
      processed: rows.length,
      reminders: rows.map(r => ({
        email: r.user_email,
        college: r.college_name,
        type: r.deadline_type,
        deadline: r.deadline_date,
        daysBefore: r.days_before,
      })),
    });
  } catch (err) {
    console.error("Reminders cron error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}