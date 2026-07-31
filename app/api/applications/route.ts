import { NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function setupTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_applications (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_name TEXT NOT NULL,
      deadline DATE NOT NULL,
      app_type TEXT NOT NULL DEFAULT 'Regular Decision',
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Not Started',
      reminder_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function GET(request: Request) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 500 });
  const email = await getSessionEmail(request as Parameters<typeof getSessionEmail>[0]);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await setupTable();
  const rows = await q(
    "SELECT id, school_name, deadline::text, app_type, notes, status, reminder_sent FROM edutracker_applications WHERE user_email = $1 ORDER BY deadline ASC",
    [email]
  );
  return NextResponse.json({ applications: rows });
}

export async function POST(request: Request) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 500 });
  const email = await getSessionEmail(request as Parameters<typeof getSessionEmail>[0]);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await setupTable();
  const body = await request.json();
  const { school_name, deadline, app_type, notes, status } = body;
  if (!school_name || !deadline) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const rows = await q(
    "INSERT INTO edutracker_applications (user_email, school_name, deadline, app_type, notes, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [email, school_name, deadline, app_type || "Regular Decision", notes || "", status || "Not Started"]
  );
  return NextResponse.json({ id: (rows as Array<{ id: number }>)[0].id });
}