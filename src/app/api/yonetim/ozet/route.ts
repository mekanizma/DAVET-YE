import { NextResponse } from "next/server";
import { getPublicCatalog, listOrders } from "@/lib/store";

export async function GET() {
  const cat = await getPublicCatalog();
  const orders = await listOrders();
  const sum = (status: string) => orders.filter((o) => o.status === status).length;
  const approved = orders.filter((o) => o.status === "onaylandi");
  const hiddenThemes = Object.values(cat.themes).filter((t) => t.hidden).length;
  return NextResponse.json({
    paymentReady: cat.paymentReady,
    bankName: cat.settings.bankName,
    accountHolder: cat.settings.accountHolder,
    iban: cat.settings.iban,
    counts: {
      bekliyor: sum("bekliyor"),
      bildirildi: sum("bildirildi"),
      onaylandi: sum("onaylandi"),
      reddedildi: sum("reddedildi"),
      themes: Object.keys(cat.themes).length,
      hiddenThemes,
      newspapers: Object.keys(cat.newspapers).length,
    },
    approvedTotal: approved.reduce((s, o) => s + o.total, 0),
    recent: orders.slice(0, 8),
  });
}
