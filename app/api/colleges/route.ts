import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "../../../lib/db";

async function setupTable() {
  if (!hasDb()) return;
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_colleges (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      college_name TEXT NOT NULL,
      app_type TEXT NOT NULL,
      deadline DATE NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ colleges: [] });
  }
  try {
    await setupTable();
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const rows = await q(
      "SELECT id, college_name, app_type, deadline::text, notes, created_at FROM edutracker_colleges WHERE user_email = $1 ORDER BY deadline ASC",
      [email]
    );
    return NextResponse.json({ colleges: rows });
  } catch (err) {
    console.error("GET /api/colleges error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }
  try {
    await setupTable();
    const body = await req.json();
    const { email, college_name, app_type, deadline, notes } = body;

    if (!email || !college_name || !app_type || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicates
    const existing = await q(
      "SELECT id FROM edutracker_colleges WHERE user_email = $1 AND college_name = $2 AND app_type = $3",
      [email, college_name, app_type]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "You already added this college with this application type." }, { status: 409 });
    }

    await q(
      "INSERT INTO edutracker_colleges (user_email, college_name, app_type, deadline, notes) VALUES ($1, $2, $3, $4, $5)",
      [email, college_name, app_type, deadline, notes || ""]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/colleges error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured" }, { status: 503 });
  }
  try {
    await setupTable();
    const body = await req.json();
    const { id, email } = body;

    if (!id || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await q(
      "DELETE FROM edutracker_colleges WHERE id = $1 AND user_email = $2",
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/colleges error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}