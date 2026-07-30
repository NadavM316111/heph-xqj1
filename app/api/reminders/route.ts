import { NextRequest, NextResponse } from "next/server";
import { hasDb, ensure, q } from "../../../lib/db";

const P = process.env.APP_TABLE_PREFIX ?? "edutracker_";

async function setupTables() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${P}users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${P}user_schools (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES ${P}users(id) ON DELETE CASCADE,
      college_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, college_id)
    )
  `);
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${P}reminder_prefs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES ${P}users(id) ON DELETE CASCADE,
      email_enabled BOOLEAN DEFAULT TRUE,
      sms_enabled BOOLEAN DEFAULT FALSE,
      phone TEXT,
      reminder_days TEXT DEFAULT '30,14,7,1',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, schools, prefs } = body as {
      email: string;
      schools: string[];
      prefs: { email: boolean; sms: boolean; phone: string; days: number[] };
    };

    if (!email || !schools || !prefs) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!hasDb()) {
      // No DB configured — return ok for demo mode
      return NextResponse.json({ ok: true, demo: true });
    }

    await setupTables();

    // Upsert user
    const userRes = await q(
      `INSERT INTO ${P}users (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [email]
    );
    const userId = (userRes as { rows: Array<{ id: number }> }).rows[0].id;

    // Delete old schools
    await q(`DELETE FROM ${P}user_schools WHERE user_id = $1`, [userId]);

    // Insert new schools
    for (const collegeId of schools) {
      await q(
        `INSERT INTO ${P}user_schools (user_id, college_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, collegeId]
      );
    }

    // Upsert reminder prefs
    const daysStr = prefs.days.sort((a, b) => a - b).join(",");
    await q(
      `INSERT INTO ${P}reminder_prefs (user_id, email_enabled, sms_enabled, phone, reminder_days, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         email_enabled = EXCLUDED.email_enabled,
         sms_enabled = EXCLUDED.sms_enabled,
         phone = EXCLUDED.phone,
         reminder_days = EXCLUDED.reminder_days,
         updated_at = NOW()`,
      [userId, prefs.email, prefs.sms, prefs.phone || null, daysStr]
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Reminders API error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    if (!hasDb()) {
      return NextResponse.json({ ok: true, schools: [], prefs: null, demo: true });
    }

    await setupTables();

    const userRes = await q(`SELECT id FROM ${P}users WHERE email = $1`, [email]);
    const rows = (userRes as { rows: Array<{ id: number }> }).rows;
    if (rows.length === 0) {
      return NextResponse.json({ ok: true, schools: [], prefs: null });
    }

    const userId = rows[0].id;

    const schoolsRes = await q(`SELECT college_id FROM ${P}user_schools WHERE user_id = $1`, [userId]);
    const schools = (schoolsRes as { rows: Array<{ college_id: string }> }).rows.map((r) => r.college_id);

    const prefsRes = await q(`SELECT * FROM ${P}reminder_prefs WHERE user_id = $1`, [userId]);
    const prefsRows = (prefsRes as { rows: Array<{ email_enabled: boolean; sms_enabled: boolean; phone: string; reminder_days: string }> }).rows;
    const prefs = prefsRows.length > 0 ? prefsRows[0] : null;

    return NextResponse.json({ ok: true, schools, prefs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}