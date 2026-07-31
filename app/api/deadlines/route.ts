import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = `${process.env.APP_TABLE_PREFIX || "edutracker"}_deadlines`;

async function ensureTable() {
  await ensure(TABLE, async () => {
    await q(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        college_name TEXT NOT NULL,
        application_type TEXT NOT NULL,
        deadline_date DATE NOT NULL,
        notes TEXT DEFAULT '',
        reminder_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      []
    );
    await q(`CREATE INDEX IF NOT EXISTS idx_${TABLE}_user ON ${TABLE}(user_email)`, []);
    await q(`CREATE INDEX IF NOT EXISTS idx_${TABLE}_date ON ${TABLE}(deadline_date)`, []);
  });
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ deadlines: [] });

  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();

  const rows = await q(
    `SELECT id, college_name, application_type, deadline_date::text, notes, reminder_sent, created_at
     FROM ${TABLE}
     WHERE user_email = $1
     ORDER BY deadline_date ASC`,
    [email]
  );

  return NextResponse.json({ deadlines: rows.rows });
}

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 503 });

  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();

  const body = await req.json();
  const { college_name, application_type, deadline_date, notes } = body;

  if (!college_name?.trim()) return NextResponse.json({ error: "College name required" }, { status: 400 });
  if (!deadline_date) return NextResponse.json({ error: "Deadline date required" }, { status: 400 });
  if (!application_type) return NextResponse.json({ error: "Application type required" }, { status: 400 });

  const result = await q(
    `INSERT INTO ${TABLE} (user_email, college_name, application_type, deadline_date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [email, college_name.trim(), application_type, deadline_date, (notes || "").trim()]
  );

  return NextResponse.json({ ok: true, id: result.rows[0].id });
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 503 });

  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await ensureTable();

  await q(
    `DELETE FROM ${TABLE} WHERE id = $1 AND user_email = $2`,
    [parseInt(id), email]
  );

  return NextResponse.json({ ok: true });
}