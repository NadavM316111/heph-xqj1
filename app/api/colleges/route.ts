import { NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { COLLEGES } from "@/lib/colleges";

async function seedColleges() {
  await ensure();
  await q(`
    CREATE TABLE IF NOT EXISTS et_colleges (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      ea_deadline DATE,
      ed_deadline DATE,
      ed2_deadline DATE,
      rd_deadline DATE,
      rolling BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []);

  const count = await q(`SELECT COUNT(*) as c FROM et_colleges`, []);
  const c = parseInt((count.rows[0] as { c: string }).c);
  if (c === 0) {
    for (const col of COLLEGES) {
      await q(
        `INSERT INTO et_colleges (name, state, ea_deadline, ed_deadline, ed2_deadline, rd_deadline, rolling)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [col.name, col.state, col.ea_deadline, col.ed_deadline, col.ed2_deadline, col.rd_deadline, col.rolling]
      );
    }
  }
}

export async function GET() {
  try {
    await seedColleges();
    const result = await q(`SELECT * FROM et_colleges ORDER BY name ASC`, []);
    return NextResponse.json({ colleges: result.rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ colleges: [] });
  }
}