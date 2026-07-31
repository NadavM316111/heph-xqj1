import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

async function setupTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_reminders (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      college_id TEXT NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      notify_email BOOLEAN DEFAULT true,
      notify_sms BOOLEAN DEFAULT false,
      sms_number TEXT,
      intervals TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(email, college_id, deadline_type)
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    if (!hasDb()) {
      return NextResponse.json({ ok: true, message: "Saved locally (no DB)" });
    }

    const body = await req.json() as {
      email: string;
      deadlines: Array<{
        collegeId: string;
        collegeName: string;
        type: string;
        date: string;
      }>;
      prefs: {
        email: boolean;
        sms: boolean;
        smsNumber: string;
        intervals: number[];
      };
    };

    await setupTable();

    // Delete old reminders for this user
    await q("DELETE FROM edutracker_reminders WHERE email = $1", [body.email]);

    // Insert new reminders
    for (const dl of body.deadlines) {
      await q(
        `INSERT INTO edutracker_reminders
          (email, college_id, college_name, deadline_type, deadline_date,
           notify_email, notify_sms, sms_number, intervals)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email, college_id, deadline_type) DO UPDATE SET
           deadline_date = EXCLUDED.deadline_date,
           notify_email = EXCLUDED.notify_email,
           notify_sms = EXCLUDED.notify_sms,
           sms_number = EXCLUDED.sms_number,
           intervals = EXCLUDED.intervals`,
        [
          body.email,
          dl.collegeId,
          dl.collegeName,
          dl.type,
          dl.date,
          body.prefs.email,
          body.prefs.sms,
          body.prefs.smsNumber || null,
          JSON.stringify(body.prefs.intervals),
        ]
      );
    }

    return NextResponse.json({ ok: true, saved: body.deadlines.length });
  } catch (err) {
    console.error("Reminders save error:", err);
    return NextResponse.json({ ok: false, error: "Failed to save reminders" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!hasDb()) {
      return NextResponse.json({ reminders: [] });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    await setupTable();

    const rows = await q(
      "SELECT * FROM edutracker_reminders WHERE email = $1 ORDER BY deadline_date ASC",
      [email]
    );

    return NextResponse.json({ reminders: rows });
  } catch (err) {
    console.error("Reminders fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}