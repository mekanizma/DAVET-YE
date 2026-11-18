import { NextResponse } from "next/server";
import { pendingPaymentCount } from "@/lib/store";

export async function GET() {
  const bildirildi = await pendingPaymentCount();
  return NextResponse.json({ bildirildi }, { headers: { "Cache-Control": "no-store" } });
}
