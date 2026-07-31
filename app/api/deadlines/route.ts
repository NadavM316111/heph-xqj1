import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function ensureTable() {
  await ensure();
  await q(`
    CREATE TABLE IF NOT EXISTS et_user_deadlines (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_id INTEGER NOT NULL,
      college_name TEXT NOT NULL,
      deadline_type TEXT NOT NULL,
      deadline_date DATE NOT NULL,
      reminder_30 BOOLEAN DEFAULT TRUE,
      reminder_14 BOOLEAN DEFAULT TRUE,
      reminder_7 BOOLEAN DEFAULT TRUE,
      reminder_1 BOOLEAN DEFAULT TRUE,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []);
}

export async function GET(req: NextRequest) {
  try {
    const email = await getSessionEmail(req);
    if (!email) return NextResponse.json({ deadlines: [] });
    await ensureTable();
    const result = await q(
      `SELECT d.*, c.name as college_name
       FROM et_user_deadlines d
       LEFT JOIN et_colleges c ON d.college_id = c.id
       WHERE d.user_email = $1
       ORDER BY d.deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ deadlines: result.rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ deadlines: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await getSessionEmail(req);
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    await ensureTable();
    const body = await req.json();
    const entries: Array<{ college_id: number; deadline_type: string; deadline_date: string }> = body.entries || [];

    const inserted = [];
    for (const entry of entries) {
      // Get college name
      const college = await q(`SELECT name FROM et_colleges WHERE id = $1`, [entry.college_id]);
      const collegeName = college.rows.length > 0 ? (college.rows[0] as { name: string }).name : "Unknown";

      // Upsert - avoid duplicates
      const existing = await q(
        `SELECT id FROM et_user_deadlines WHERE user_email = $1 AND college_id = $2 AND deadline_type = $3`,
        [email, entry.college_id, entry.deadline_type]
      );

      if (existing.rows.length === 0) {
        const r = await q(
          `INSERT INTO et_user_deadlines (user_email, college_id, college_name, deadline_type, deadline_date, reminder_30, reminder_14, reminder_7, reminder_1, notes)
           VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, TRUE, TRUE, '')
           RETURNING *`,
          [email, entry.college_id, collegeName, entry.deadline_type, entry.deadline_date]
        );
        inserted.push(r.rows[0]);
      }
    }
    return NextResponse.json({ inserted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const email = await getSessionEmail(req);
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    await ensureTable();
    const body = await req.json();
    await q(
      `DELETE FROM et_user_deadlines WHERE id = $1 AND user_email = $2`,
      [body.id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const email = await getSessionEmail(req);
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    await ensureTable();
    const body = await req.json();
    await q(
      `UPDATE et_user_deadlines SET notes = $1 WHERE id = $2 AND user_email = $3`,
      [body.notes, body.id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}