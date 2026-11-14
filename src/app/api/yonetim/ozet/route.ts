import { NextResponse } from "next/server";
import { deskSummary, nudgeShopierSync } from "@/lib/store";

export async function GET() {
  await nudgeShopierSync();
  const desk = await deskSummary();
  return NextResponse.json({
    paymentReady: desk.paymentReady,
    bankName: "",
    accountHolder: "",
    iban: "",
    counts: desk.counts,
    approvedTotal: desk.approvedTotal,
    recent: desk.recent,
  });
}
