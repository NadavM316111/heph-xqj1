import { NextRequest, NextResponse } from "next/server";
import { q, hasDb } from "@/lib/db";

interface DeadlineEntry {
  collegeId: string;
  collegeName: string;
  type: string;
  date: string;
  daysUntil: number;
}

interface ReminderPayload {
  email: string;
  deadlines: DeadlineEntry[];
  gradYear: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ReminderPayload = await req.json();
    const { email, deadlines, gradYear } = body;

    if (!email || !deadlines || !Array.isArray(deadlines)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!hasDb()) {
      // No DB available — still return success so the UI works
      return NextResponse.json({
        ok: true,
        message: "Reminders noted (no DB configured)",
        scheduled: 0,
      });
    }

    const prefix = process.env.APP_TABLE_PREFIX ?? "app";

    // Ensure reminder tables exist
    await q(
      `CREATE TABLE IF NOT EXISTS "${prefix}_reminder_schedules" (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        college_id TEXT NOT NULL,
        college_name TEXT NOT NULL,
        deadline_type TEXT NOT NULL,
        deadline_date DATE NOT NULL,
        grad_year TEXT,
        remind_30 BOOLEAN DEFAULT FALSE,
        remind_14 BOOLEAN DEFAULT FALSE,
        remind_7 BOOLEAN DEFAULT FALSE,
        remind_1 BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(email, college_id, deadline_type)
      )`,
      []
    );

    // Upsert each deadline reminder schedule
    let scheduled = 0;
    for (const dl of deadlines) {
      if (!dl.date || !dl.collegeId || !dl.type) continue;
      try {
        await q(
          `INSERT INTO "${prefix}_reminder_schedules"
            (email, college_id, college_name, deadline_type, deadline_date, grad_year,
             remind_30, remind_14, remind_7, remind_1, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, false, false, false, false, NOW())
           ON CONFLICT (email, college_id, deadline_type)
           DO UPDATE SET
             college_name = EXCLUDED.college_name,
             deadline_date = EXCLUDED.deadline_date,
             grad_year = EXCLUDED.grad_year,
             remind_30 = false,
             remind_14 = false,
             remind_7 = false,
             remind_1 = false,
             updated_at = NOW()`,
          [email, dl.collegeId, dl.collegeName, dl.type, dl.date, gradYear]
        );
        scheduled++;
      } catch {
        // Continue if individual insert fails
      }
    }

    // Remove reminders for colleges no longer in the list
    const collegeIds = deadlines.map((d) => d.collegeId);
    if (collegeIds.length > 0) {
      // Build a parameterized NOT IN query
      const placeholders = collegeIds.map((_, i) => `$${i + 2}`).join(", ");
      await q(
        `DELETE FROM "${prefix}_reminder_schedules"
         WHERE email = $1 AND college_id NOT IN (${placeholders})`,
        [email, ...collegeIds]
      );
    }

    return NextResponse.json({ ok: true, scheduled });
  } catch (err) {
    console.error("Reminders API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    if (!hasDb()) {
      return NextResponse.json({ ok: true, reminders: [] });
    }

    const prefix = process.env.APP_TABLE_PREFIX ?? "app";

    const rows = await q(
      `SELECT * FROM "${prefix}_reminder_schedules" WHERE email = $1 ORDER BY deadline_date ASC`,
      [email]
    );

    return NextResponse.json({ ok: true, reminders: rows });
  } catch (err) {
    console.error("Reminders GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}