import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { cookies } from "next/headers";

async function getUserEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    const decoded = Buffer.from(session, "base64").toString("utf-8");
    const { email } = JSON.parse(decoded);
    return email || null;
  } catch { return null; }
}

async function ensureTables() {
  if (!hasDb()) return;
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_deadlines (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_id TEXT NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      notes TEXT DEFAULT '',
      reminder_30 BOOLEAN DEFAULT true,
      reminder_14 BOOLEAN DEFAULT true,
      reminder_7 BOOLEAN DEFAULT true,
      reminder_1 BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_reminders (
      id SERIAL PRIMARY KEY,
      deadline_id INTEGER REFERENCES edutracker_deadlines(id) ON DELETE CASCADE,
      user_email TEXT NOT NULL,
      days_before INTEGER NOT NULL,
      send_at DATE NOT NULL,
      sent BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET() {
  const email = await getUserEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasDb()) {
    return NextResponse.json({ deadlines: [] });
  }

  await ensureTables();

  try {
    const rows = await q(
      `SELECT id, college_id, college_name, deadline_type, deadline_date::text, notes,
              reminder_30, reminder_14, reminder_7, reminder_1, created_at
       FROM edutracker_deadlines
       WHERE user_email = $1
       ORDER BY deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ deadlines: rows });
  } catch (err) {
    console.error("GET deadlines error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const email = await getUserEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }

  await ensureTables();

  try {
    const body = await req.json();
    const { college_id, college_name, deadline_type, deadline_date, notes, reminder_30, reminder_14, reminder_7, reminder_1 } = body;

    if (!college_name || !deadline_type || !deadline_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rows = await q(
      `INSERT INTO edutracker_deadlines
         (user_email, college_id, college_name, deadline_type, deadline_date, notes, reminder_30, reminder_14, reminder_7, reminder_1)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [email, college_id, college_name, deadline_type, deadline_date, notes || "", !!reminder_30, !!reminder_14, !!reminder_7, !!reminder_1]
    );

    const deadlineId = (rows as Array<{ id: number }>)[0].id;

    // Schedule reminders
    const deadlineDateObj = new Date(deadline_date + "T00:00:00");
    const reminderDays: Array<{ days: number; enabled: boolean }> = [
      { days: 30, enabled: !!reminder_30 },
      { days: 14, enabled: !!reminder_14 },
      { days: 7, enabled: !!reminder_7 },
      { days: 1, enabled: !!reminder_1 },
    ];

    for (const r of reminderDays) {
      if (!r.enabled) continue;
      const sendAt = new Date(deadlineDateObj);
      sendAt.setDate(sendAt.getDate() - r.days);
      const sendAtStr = sendAt.toISOString().split("T")[0];
      await q(
        `INSERT INTO edutracker_reminders (deadline_id, user_email, days_before, send_at)
         VALUES ($1,$2,$3,$4)`,
        [deadlineId, email, r.days, sendAtStr]
      );
    }

    return NextResponse.json({ ok: true, id: deadlineId });
  } catch (err) {
    console.error("POST deadline error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const email = await getUserEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await q(
      `DELETE FROM edutracker_deadlines WHERE id = $1 AND user_email = $2`,
      [parseInt(id, 10), email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE deadline error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}