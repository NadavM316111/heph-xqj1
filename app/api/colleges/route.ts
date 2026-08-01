import { NextRequest, NextResponse } from "next/server";
import { q, P, ensureTable } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = P + "_colleges";

async function setup() {
  await ensureTable(
    `CREATE TABLE IF NOT EXISTS ${TABLE} (id SERIAL PRIMARY KEY, owner_email TEXT NOT NULL, name TEXT NOT NULL, deadline TEXT NOT NULL, notes TEXT, created_at TIMESTAMPTZ DEFAULT now())`
  );
}

export async function GET(req: NextRequest) {
  await setup();
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await q(`SELECT COUNT(*) as c FROM ${TABLE}`, []);
  const c = parseInt((count[0] as { c: string }).c);

  return NextResponse.json({ count: c });
}