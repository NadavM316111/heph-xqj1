import { NextRequest, NextResponse } from "next/server";
import { q, hasDb } from "@/lib/db";
import { COLLEGES } from "@/lib/colleges";

interface ReminderPayload {
  email: string;
  phone?: string;
  reminders: number[];
  schools: { collegeId: string; deadlineTypes: string[] }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ReminderPayload = await req.json();
    const { email, phone, reminders, schools } = body;

    if (!email || !schools || schools.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!hasDb()) {
      // No DB — just acknowledge
      return NextResponse.json({ ok: true, message: "Reminders noted (no DB configured)" });
    }

    const prefix = process.env.APP_TABLE_PREFIX ?? "edutracker";
    const settingsTable = `${prefix}_reminder_settings`;
    const deadlinesTable = `${prefix}_user_deadlines`;

    // Create tables if they don't exist
    await q(
      `CREATE TABLE IF NOT EXISTS ${settingsTable} (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        phone TEXT,
        reminder_days INTEGER[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      []
    );

    await q(
      `CREATE TABLE IF NOT EXISTS ${deadlinesTable} (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        college_id TEXT NOT NULL,
        college_name TEXT NOT NULL,
        deadline_type TEXT NOT NULL,
        deadline_date DATE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      []
    );

    // Upsert reminder settings
    const existing = await q(
      `SELECT id FROM ${settingsTable} WHERE email = $1`,
      [email]
    );

    if (existing.rows.length > 0) {
      await q(
        `UPDATE ${settingsTable} SET phone = $1, reminder_days = $2, updated_at = NOW() WHERE email = $3`,
        [phone ?? null, reminders, email]
      );
    } else {
      await q(
        `INSERT INTO ${settingsTable} (email, phone, reminder_days) VALUES ($1, $2, $3)`,
        [email, phone ?? null, reminders]
      );
    }

    // Replace user deadlines
    await q(`DELETE FROM ${deadlinesTable} WHERE email = $1`, [email]);

    for (const sel of schools) {
      const college = COLLEGES.find((c) => c.id === sel.collegeId);
      if (!college) continue;
      for (const dt of sel.deadlineTypes) {
        const deadlineTypes = ["ED1", "ED2", "EA", "RD"] as const;
        type DeadlineType = typeof deadlineTypes[number];
        const dateStr = college.deadlines[dt as DeadlineType];
        if (!dateStr) continue;
        await q(
          `INSERT INTO ${deadlinesTable} (email, college_id, college_name, deadline_type, deadline_date)
           VALUES ($1, $2, $3, $4, $5)`,
          [email, college.id, college.name, dt, dateStr]
        );
      }
    }

    return NextResponse.json({ ok: true, message: "Reminders saved successfully" });
  } catch (err) {
    console.error("Reminders API error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  if (!hasDb()) {
    return NextResponse.json({ settings: null, deadlines: [] });
  }

  const prefix = process.env.APP_TABLE_PREFIX ?? "edutracker";
  const settingsTable = `${prefix}_reminder_settings`;
  const deadlinesTable = `${prefix}_user_deadlines`;

  try {
    const settings = await q(`SELECT * FROM ${settingsTable} WHERE email = $1`, [email]);
    const deadlines = await q(
      `SELECT * FROM ${deadlinesTable} WHERE email = $1 ORDER BY deadline_date ASC`,
      [email]
    );

    return NextResponse.json({
      settings: settings.rows[0] ?? null,
      deadlines: deadlines.rows,
    });
  } catch {
    return NextResponse.json({ settings: null, deadlines: [] });
  }
}