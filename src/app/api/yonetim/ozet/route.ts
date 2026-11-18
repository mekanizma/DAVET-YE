import { NextResponse } from "next/server";
import { deskSummary } from "@/lib/store";

export async function GET() {
  const desk = await deskSummary();
  return NextResponse.json({
    paymentReady: desk.paymentReady,
    cardPayments: desk.cardPayments,
    bankTransfer: desk.bankTransfer,
    shopierEnabled: desk.shopierEnabled,
    ibanEnabled: desk.ibanEnabled,
    bankName: desk.bankName,
    accountHolder: desk.accountHolder,
    iban: desk.iban,
    counts: desk.counts,
    approvedTotal: desk.approvedTotal,
    recent: desk.recent,
  });
}
