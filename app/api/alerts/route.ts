import { NextResponse, NextRequest } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";

const PREFIX = process.env.APP_TABLE_PREFIX ?? "edutracker";
const TABLE = `${PREFIX}_applications`;

async function ensureTable() {
  if (!hasDb()) return;
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_id TEXT NOT NULL,
      school_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'not_started',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_email, school_id, deadline_type)
    )
  `);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function GET(req: NextRequest) {
  const authRes = await fetch(new URL("/api/auth", req.url), {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const authData = await authRes.json();
  const email = authData.email as string;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json({ alerts: [] });
  }

  await ensureTable();

  // Get applications due within 7 days
  const rows = await q(
    `SELECT * FROM ${TABLE}
     WHERE user_email = $1
     AND deadline_date >= CURRENT_DATE
     AND deadline_date <= CURRENT_DATE + INTERVAL '7 days'
     AND status != 'submitted'
     ORDER BY deadline_date ASC`,
    [email]
  );

  const alerts = (rows.rows ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    daysUntil: daysUntil(row.deadline_date as string),
  }));

  return NextResponse.json({ alerts });
}