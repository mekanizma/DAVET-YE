import { NextResponse } from "next/server";
import { trafficSummary } from "@/lib/traffic";

export async function GET() {
  const summary = await trafficSummary();
  return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
}
