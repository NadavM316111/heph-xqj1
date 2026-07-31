import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "../../../lib/db";

async function initTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_reminders (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      college_id TEXT NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date TEXT NOT NULL,
      days_before INTEGER NOT NULL,
      scheduled_send_date TEXT NOT NULL,
      sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(email, college_id, deadline_type, days_before)
    )
  `);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ reminders: [] });
  }
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }
  try {
    await initTable();
    const rows = await q(
      "SELECT college_id, deadline_type, days_before FROM edutracker_reminders WHERE email = $1 AND sent = FALSE ORDER BY scheduled_send_date ASC",
      [email]
    );
    return NextResponse.json({ reminders: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ reminders: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ ok: true, count: 0, note: "No database configured" });
  }
  try {
    const body = await req.json();
    const { email, deadlines } = body as {
      email: string;
      deadlines: Array<{ collegeId: string; collegeName: string; type: string; date: string }>;
    };

    if (!email || !deadlines || !Array.isArray(deadlines)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await initTable();

    let count = 0;
    const daysBefore = [30, 14, 7];

    for (const deadline of deadlines) {
      const deadlineDate = new Date(deadline.date + "T00:00:00");

      for (const days of daysBefore) {
        const sendDate = new Date(deadlineDate);
        sendDate.setDate(sendDate.getDate() - days);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (sendDate <= today) continue;

        const sendDateStr = sendDate.toISOString().split("T")[0];

        try {
          await q(
            `INSERT INTO edutracker_reminders 
              (email, college_id, college_name, deadline_type, deadline_date, days_before, scheduled_send_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email, college_id, deadline_type, days_before) 
             DO UPDATE SET scheduled_send_date = $7, deadline_date = $5, sent = FALSE`,
            [email, deadline.collegeId, deadline.collegeName, deadline.type, deadline.date, days, sendDateStr]
          );
          count++;
        } catch (insertErr) {
          console.error("Insert error:", insertErr);
        }
      }
    }

    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}