import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt(params.id);
  const body = await req.json();

  const allowed = ["college_name", "app_type", "deadline_date", "notes", "status", "reminder_sent"];
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (key in body) {
      fields.push(`${key} = $${idx}`);
      values.push(body[key]);
      idx++;
    }
  }

  if (fields.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  values.push(id, email);
  const rows = await q(
    `UPDATE __APP__deadlines SET ${fields.join(", ")} WHERE id = $${idx} AND user_email = $${idx + 1} RETURNING *`,
    values
  );
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deadline: rows[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt(params.id);
  await q(
    "DELETE FROM __APP__deadlines WHERE id = $1 AND user_email = $2",
    [id, email]
  );
  return NextResponse.json({ ok: true });
}