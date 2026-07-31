import { NextResponse } from "next/server";
import { COLLEGES } from "@/lib/colleges";

export async function GET() {
  return NextResponse.json({ colleges: COLLEGES });
}