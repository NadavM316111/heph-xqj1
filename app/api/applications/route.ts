import { NextRequest, NextResponse } from "next/server";
import { q, P, ensureTable, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function initTable() {
  await ensureTable(
    "CREATE TABLE IF NOT EXISTS " +
      P +
      "_applications (" +
      "id SERIAL PRIMARY KEY, " +
      "owner_email TEXT NOT NULL, " +
      "school_name TEXT NOT NULL, " +
      "deadline DATE NOT NULL, " +
      "notes TEXT DEFAULT '', " +
      "created_at TIMESTAMPTZ DEFAULT NOW()" +
      ")"
  );
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ applications: [] });
  }
  const email = getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    await initTable();
    const rows = await q(
      "SELECT id, owner_email, school_name, deadline, notes, created_at FROM " +
        P +
        "_applications WHERE owner_email = $1 ORDER BY deadline ASC",
      [email]
    );
    return NextResponse.json({ applications: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured." }, { status: 503 });
  }
  const email = getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let body: { school_name?: string; deadline?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { school_name, deadline, notes } = body;
  if (!school_name || !deadline) {
    return NextResponse.json(
      { error: "school_name and deadline are required" },
      { status: 400 }
    );
  }
  try {
    await initTable();
    const rows = await q(
      "INSERT INTO " +
        P +
        "_applications (owner_email, school_name, deadline, notes) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, school_name, deadline, notes || ""]
    );
    return NextResponse.json({ application: rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database configured." }, { status: 503 });
  }
  const email = getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let body: { id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  try {
    await initTable();
    await q(
      "DELETE FROM " + P + "_applications WHERE id = $1 AND owner_email = $2",
      [id, email]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}