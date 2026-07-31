import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

async function ensureTable() {
  if (!hasDb()) return;
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_schools (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_id TEXT NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      email_reminder BOOLEAN DEFAULT true,
      sms_reminder BOOLEAN DEFAULT false,
      phone_number TEXT DEFAULT '',
      reminder_email TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_email, college_id, deadline_type)
    )
  `);
}

async function getUser(): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth`, {
      headers: { cookie: "" },
    });
    const data = await res.json();
    return data.email || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ schools: [] });
  }

  try {
    await ensureTable();

    const authRes = await fetch(new URL("/api/auth", req.url).toString(), {
      headers: { cookie: req.headers.get("cookie") || "" },
    });
    const authData = await authRes.json();
    const email = authData.email;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await q(
      "SELECT * FROM edutracker_schools WHERE user_email = $1 ORDER BY deadline_date ASC",
      [email]
    );

    return NextResponse.json({ schools: rows });
  } catch (err) {
    console.error("GET /api/schools error:", err);
    return NextResponse.json({ schools: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    await ensureTable();

    const authRes = await fetch(new URL("/api/auth", req.url).toString(), {
      headers: { cookie: req.headers.get("cookie") || "" },
    });
    const authData = await authRes.json();
    const email = authData.email;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { schools } = body;

    if (!Array.isArray(schools)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const inserted = [];
    for (const school of schools) {
      try {
        const rows = await q(
          `INSERT INTO edutracker_schools
            (user_email, college_id, college_name, deadline_type, deadline_date, email_reminder, sms_reminder, phone_number, reminder_email)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (user_email, college_id, deadline_type)
           DO UPDATE SET
             deadline_date = EXCLUDED.deadline_date,
             email_reminder = EXCLUDED.email_reminder,
             sms_reminder = EXCLUDED.sms_reminder,
             phone_number = EXCLUDED.phone_number,
             reminder_email = EXCLUDED.reminder_email
           RETURNING *`,
          [
            email,
            school.collegeId,
            school.collegeName,
            school.deadlineType,
            school.deadlineDate,
            school.emailReminder ?? true,
            school.smsReminder ?? false,
            school.phone || "",
            school.email || email,
          ]
        );
        inserted.push(...(rows as unknown[]));
      } catch (err) {
        console.error("Insert error for", school.collegeId, err);
      }
    }

    return NextResponse.json({ inserted: inserted.length });
  } catch (err) {
    console.error("POST /api/schools error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    await ensureTable();

    const authRes = await fetch(new URL("/api/auth", req.url).toString(), {
      headers: { cookie: req.headers.get("cookie") || "" },
    });
    const authData = await authRes.json();
    const email = authData.email;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await q(
      "DELETE FROM edutracker_schools WHERE id = $1 AND user_email = $2",
      [parseInt(id), email]
    );

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/schools error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}