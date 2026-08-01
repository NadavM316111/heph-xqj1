import { NextRequest, NextResponse } from "next/server";
import { q, P, ensureTable, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

let tableReady = false;

async function initTable() {
  if (tableReady) return;
  await ensureTable(
    "CREATE TABLE IF NOT EXISTS " +
      P +
      "_alerts (id SERIAL PRIMARY KEY, owner_email TEXT NOT NULL, message TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())"
  );
  tableReady = true;
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ alerts: [] });
  const email = getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  await initTable();
  const rows = await q(
    "SELECT * FROM " + P + "_alerts WHERE owner_email = $1 ORDER BY created_at DESC",
    [email]
  );
  return NextResponse.json({ alerts: rows });
}