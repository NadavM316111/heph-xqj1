import { NextResponse } from "next/server";
import { SCHOOLS } from "@/lib/schools";

export async function GET() {
  return NextResponse.json({ schools: SCHOOLS });
}