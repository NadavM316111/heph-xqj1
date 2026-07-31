import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function setupTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS __APP_deadlines (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_name TEXT NOT NULL,
      application_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      notes TEXT DEFAULT '',
      email_reminder_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ deadlines: [] });
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await setupTable();

  const rows = await q(
    `SELECT id, school_name, application_type, deadline_date::text, notes, email_reminder_sent,
      (deadline_date - CURRENT_DATE) AS days_until
     FROM __APP_deadlines
     WHERE user_email = $1
     ORDER BY deadline_date ASC`,
    [email]
  );

  return NextResponse.json({ deadlines: rows });
}

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No DB" }, { status: 500 });
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await setupTable();

  const body = await req.json();
  const { school_name, application_type, deadline_date, notes } = body;

  if (!school_name || !deadline_date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const rows = await q(
    `INSERT INTO __APP_deadlines (user_email, school_name, application_type, deadline_date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [email, school_name, application_type || "Regular Decision (RD)", deadline_date, notes || ""]
  );

  return NextResponse.json({ ok: true, id: rows[0]?.id });
}

export async function PUT(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No DB" }, { status: 500 });
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await setupTable();

  const body = await req.json();
  const { id, school_name, application_type, deadline_date, notes } = body;

  if (!id || !school_name || !deadline_date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await q(
    `UPDATE __APP_deadlines
     SET school_name = $1, application_type = $2, deadline_date = $3, notes = $4
     WHERE id = $5 AND user_email = $6`,
    [school_name, application_type || "Regular Decision (RD)", deadline_date, notes || "", id, email]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No DB" }, { status: 500 });
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await setupTable();

  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await q(
    `DELETE FROM __APP_deadlines WHERE id = $1 AND user_email = $2`,
    [id, email]
  );

  return NextResponse.json({ ok: true });
}