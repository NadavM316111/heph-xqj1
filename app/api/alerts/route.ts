import { NextResponse } from "next/server";
import { q, P, ensureTable } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

async function setup() {
  await ensureTable(
    "CREATE TABLE IF NOT EXISTS " +
      P +
      "_alerts (id SERIAL PRIMARY KEY, owner_email TEXT NOT NULL, app_id INTEGER NOT NULL, sent_at TIMESTAMPTZ DEFAULT now())"
  );
}

export async function GET(req: Request) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await setup();

  const rows = await q(
    "SELECT a.id, a.school, a.deadline, a.round FROM " +
      P +
      "_applications a WHERE a.owner_email = $1 AND a.deadline IS NOT NULL AND a.deadline::date - CURRENT_DATE BETWEEN 0 AND 7 ORDER BY a.deadline ASC",
    [email]
  );

  return NextResponse.json({ alerts: rows });
}