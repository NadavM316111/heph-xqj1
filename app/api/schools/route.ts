import { NextRequest, NextResponse } from "next/server";
import { SCHOOLS, searchSchools } from "@/lib/schools";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const id = searchParams.get("id") ?? "";

  if (id) {
    const school = SCHOOLS.find((s) => s.id === id);
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    return NextResponse.json({ school });
  }

  const results = query ? searchSchools(query) : SCHOOLS;

  return NextResponse.json({
    schools: results,
    total: results.length,
  });
}