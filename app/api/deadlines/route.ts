import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function setupTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS ${process.env.APP_TABLE_PREFIX || ""}deadlines (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_name TEXT NOT NULL,
      deadline_date TEXT NOT NULL,
      application_type TEXT NOT NULL DEFAULT 'Regular Decision',
      notes TEXT DEFAULT '',
      reminder_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await setupTable();
    const prefix = process.env.APP_TABLE_PREFIX || "";
    const rows = await q(
      `SELECT * FROM ${prefix}deadlines WHERE user_email = $1 ORDER BY deadline_date ASC`,
      [email]
    );
    return NextResponse.json({ ok: true, deadlines: rows });
  } catch (err) {
    console.error("GET deadlines error:", err);
    return NextResponse.json({ error: "Failed to load deadlines" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await setupTable();
    const body = await req.json();
    const { school_name, deadline_date, application_type, notes } = body;

    if (!school_name || !deadline_date) {
      return NextResponse.json({ error: "school_name and deadline_date are required" }, { status: 400 });
    }

    const prefix = process.env.APP_TABLE_PREFIX || "";
    const rows = await q(
      `INSERT INTO ${prefix}deadlines (user_email, school_name, deadline_date, application_type, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [email, school_name, deadline_date, application_type || "Regular Decision", notes || ""]
    );
    return NextResponse.json({ ok: true, deadline: rows[0] });
  } catch (err) {
    console.error("POST deadlines error:", err);
    return NextResponse.json({ error: "Failed to create deadline" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await setupTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const prefix = process.env.APP_TABLE_PREFIX || "";
    await q(
      `DELETE FROM ${prefix}deadlines WHERE id = $1 AND user_email = $2`,
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE deadlines error:", err);
    return NextResponse.json({ error: "Failed to delete deadline" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await setupTable();
    const body = await req.json();
    const { id, school_name, deadline_date, application_type, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const prefix = process.env.APP_TABLE_PREFIX || "";
    const rows = await q(
      `UPDATE ${prefix}deadlines
       SET school_name = $1, deadline_date = $2, application_type = $3, notes = $4
       WHERE id = $5 AND user_email = $6
       RETURNING *`,
      [school_name, deadline_date, application_type || "Regular Decision", notes || "", id, email]
    );
    return NextResponse.json({ ok: true, deadline: rows[0] });
  } catch (err) {
    console.error("PUT deadlines error:", err);
    return NextResponse.json({ error: "Failed to update deadline" }, { status: 500 });
  }
}