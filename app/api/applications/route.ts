import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function setupTable() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS __APP_applications (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      school_name TEXT NOT NULL,
      deadline DATE NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'not_started',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  try {
    const email = await getSessionEmail(req);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await setupTable();
    const rows = await q(
      "SELECT * FROM __APP_applications WHERE user_email = $1 ORDER BY deadline ASC",
      [email]
    );
    return NextResponse.json({ applications: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await getSessionEmail(req);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await setupTable();
    const body = await req.json();
    const { school_name, deadline, notes, status } = body;

    if (!school_name || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rows = await q(
      "INSERT INTO __APP_applications (user_email, school_name, deadline, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [email, school_name, deadline, notes || "", status || "not_started"]
    );
    return NextResponse.json({ application: rows[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const email = await getSessionEmail(req);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await setupTable();
    const body = await req.json();
    const { id, school_name, deadline, notes, status } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const rows = await q(
      "UPDATE __APP_applications SET school_name = $1, deadline = $2, notes = $3, status = $4 WHERE id = $5 AND user_email = $6 RETURNING *",
      [school_name, deadline, notes || "", status || "not_started", id, email]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ application: rows[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const email = await getSessionEmail(req);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await setupTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await q(
      "DELETE FROM __APP_applications WHERE id = $1 AND user_email = $2",
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}