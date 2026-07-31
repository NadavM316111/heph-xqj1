import { NextRequest, NextResponse } from "next/server";
import { q, hasDb } from "@/lib/db";
import { cookies } from "next/headers";

const SESSIONS_TABLE = `${process.env.APP_TABLE_PREFIX || "edu"}_sessions`;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token && hasDb()) {
    try {
      await q(`DELETE FROM ${SESSIONS_TABLE} WHERE token = $1`, [token]);
    } catch {
      // ignore
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  return response;
}