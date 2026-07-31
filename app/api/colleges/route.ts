import { NextRequest, NextResponse } from "next/server";
import { q, ensure } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function setup() {
  await ensure(`
    CREATE TABLE IF NOT EXISTS edutracker_colleges (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      name TEXT NOT NULL,
      deadline DATE NOT NULL,
      app_type TEXT NOT NULL DEFAULT 'Regular Decision',
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  await setup();
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await q(
    "SELECT id, name, deadline::text, app_type, status, notes, created_at FROM edutracker_colleges WHERE user_email = $1 ORDER BY deadline ASC",
    [email]
  );
  return NextResponse.json({ colleges: rows });
}

export async function POST(req: NextRequest) {
  await setup();
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, deadline, app_type, notes } = await req.json();
  if (!name || !deadline) return NextResponse.json({ error: "Name and deadline required" }, { status: 400 });
  const rows = await q(
    "INSERT INTO edutracker_colleges (user_email, name, deadline, app_type, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [email, name, deadline, app_type || "Regular Decision", notes || ""]
  );
  return NextResponse.json({ id: rows[0]?.id });
}

export async function PATCH(req: NextRequest) {
  await setup();
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  if (body.status !== undefined) {
    await q(
      "UPDATE edutracker_colleges SET status = $1 WHERE id = $2 AND user_email = $3",
      [body.status, id, email]
    );
  } else {
    await q(
      "UPDATE edutracker_colleges SET deadline = $1, app_type = $2, notes = $3 WHERE id = $4 AND user_email = $5",
      [body.deadline, body.app_type, body.notes || "", id, email]
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await setup();
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await q("DELETE FROM edutracker_colleges WHERE id = $1 AND user_email = $2", [id, email]);
  return NextResponse.json({ ok: true });
}