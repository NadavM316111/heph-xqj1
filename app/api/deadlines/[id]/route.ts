import { NextRequest, NextResponse } from "next/server";
import { q, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = `${process.env.APP_TABLE_PREFIX || ""}deadlines`;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!hasDb()) {
    return NextResponse.json({ ok: false, error: "No database" }, { status: 503 });
  }
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const { school_name, deadline_date, app_type, notes } = body;
    if (!school_name || !deadline_date) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    const rows = await q(
      `UPDATE ${TABLE} SET school_name = $1, deadline_date = $2, app_type = $3, notes = $4, reminder_sent = FALSE WHERE id = $5 AND user_email = $6 RETURNING id`,
      [school_name, deadline_date, app_type || "Regular Decision (RD)", notes || "", id, email]
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Not found or unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/deadlines/[id] error:", err);
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!hasDb()) {
    return NextResponse.json({ ok: false, error: "No database" }, { status: 503 });
  }
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
  }
  try {
    await q(
      `DELETE FROM ${TABLE} WHERE id = $1 AND user_email = $2`,
      [id, email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/deadlines/[id] error:", err);
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }
}