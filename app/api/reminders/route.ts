import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

async function setupTables() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_reminder_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      phone TEXT,
      college_id TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(email, college_id, deadline_type, deadline_date)
    )
  `);
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_reminder_log (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      college_id TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      days_before INTEGER NOT NULL,
      sent_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, subscriptions } = body as {
      email: string;
      phone?: string;
      subscriptions: Array<{
        email: string;
        phone?: string;
        collegeId: string;
        deadlineType: string;
        deadlineDate: string;
      }>;
    };

    if (!email || !subscriptions || !Array.isArray(subscriptions)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!hasDb()) {
      return NextResponse.json({ ok: true, saved: 0, message: "No DB configured" });
    }

    await setupTables();

    let saved = 0;
    for (const sub of subscriptions) {
      try {
        await q(
          `INSERT INTO edutracker_reminder_subscribers (email, phone, college_id, deadline_type, deadline_date)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email, college_id, deadline_type, deadline_date) DO UPDATE SET phone = EXCLUDED.phone`,
          [sub.email, phone || null, sub.collegeId, sub.deadlineType, sub.deadlineDate]
        );
        saved++;
      } catch {
        // skip duplicates or errors on individual rows
      }
    }

    return NextResponse.json({ ok: true, saved });
  } catch (err) {
    console.error("Reminder POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    if (!hasDb()) {
      return NextResponse.json({ subscriptions: [] });
    }

    await setupTables();

    const rows = await q(
      `SELECT college_id, deadline_type, deadline_date, phone
       FROM edutracker_reminder_subscribers
       WHERE email = $1 AND deadline_date > NOW()
       ORDER BY deadline_date ASC`,
      [email]
    );

    return NextResponse.json({ subscriptions: rows });
  } catch (err) {
    console.error("Reminder GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}