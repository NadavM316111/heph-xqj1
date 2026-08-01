import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function initTable() {
  await ensure("edutracker_applications", () =>
    q(
      `CREATE TABLE IF NOT EXISTS edutracker_applications (
        id SERIAL PRIMARY KEY,
        owner_email TEXT NOT NULL,
        school_name TEXT NOT NULL,
        deadline DATE NOT NULL,
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      []
    )
  );
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ applications: [] });
  }
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  await initTable();
  const result = await q(
    "SELECT * FROM edutracker_applications WHERE owner_email = $1 ORDER BY deadline ASC",
    [email]
  );
  return NextResponse.json({ applications: result.rows });
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { school_name, deadline, notes } = await req.json();
  if (!school_name || !deadline) {
    return NextResponse.json({ error: "school_name and deadline are required" }, { status: 400 });
  }
  await initTable();
  const result = await q(
    "INSERT INTO edutracker_applications (owner_email, school_name, deadline, notes) VALUES ($1, $2, $3, $4) RETURNING *",
    [email, school_name, deadline, notes || ""]
  );
  return NextResponse.json({ application: result.rows[0] });
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await initTable();
  await q(
    "DELETE FROM edutracker_applications WHERE id = $1 AND owner_email = $2",
    [id, email]
  );
  return NextResponse.json({ success: true });
}