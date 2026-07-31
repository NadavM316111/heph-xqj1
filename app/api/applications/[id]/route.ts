import { NextResponse } from "next/server";
import { q, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 500 });
  const email = await getSessionEmail(request as Parameters<typeof getSessionEmail>[0]);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt(params.id);
  const body = await request.json();
  const { school_name, deadline, app_type, notes, status } = body;
  await q(
    "UPDATE edutracker_applications SET school_name=$1, deadline=$2, app_type=$3, notes=$4, status=$5 WHERE id=$6 AND user_email=$7",
    [school_name, deadline, app_type, notes, status, id, email]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 500 });
  const email = await getSessionEmail(request as Parameters<typeof getSessionEmail>[0]);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt(params.id);
  await q(
    "DELETE FROM edutracker_applications WHERE id=$1 AND user_email=$2",
    [id, email]
  );
  return NextResponse.json({ ok: true });
}