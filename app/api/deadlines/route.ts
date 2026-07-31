import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = `${process.env.APP_TABLE_PREFIX || "edutracker"}_deadlines`;

async function initTable() {
  await ensure(TABLE, `
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_name TEXT NOT NULL,
      deadline_date TEXT NOT NULL,
      application_type TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  try {
    await initTable();
    const email = await getSessionEmail(req);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rows = await q(
      `SELECT id, school_name, deadline_date, application_type, notes, created_at FROM ${TABLE} WHERE user_email = $1 ORDER BY deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ ok: true, deadlines: rows });
  } catch (err) {
    console.error("GET /api/deadlines error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initTable();
    const email = await getSessionEmail(req);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { school_name, deadline_date, application_type, notes } = body;
    if (!school_name || !deadline_date || !application_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const rows = await q(
      `INSERT INTO ${TABLE} (user_email, school_name, deadline_date, application_type, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, school_name, deadline_date, application_type, notes, created_at`,
      [email, school_name, deadline_date, application_type, notes || ""]
    );
    return NextResponse.json({ ok: true, deadline: rows[0] });
  } catch (err) {
    console.error("POST /api/deadlines error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initTable();
    const email = await getSessionEmail(req);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await q(
      `DELETE FROM ${TABLE} WHERE id = $1 AND user_email = $2`,
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/deadlines error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}