import { NextResponse } from "next/server";
import { listOrderCards, nudgeShopierSync } from "@/lib/store";
import { isOrderStatus } from "@/lib/orderStatus";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const durum = url.searchParams.get("durum") || "";
  const q = (url.searchParams.get("q") || "").trim();
  // Do not delay the order list on Shopier polling.
  void nudgeShopierSync();
  const orders = await listOrderCards({
    status: isOrderStatus(durum) ? durum : undefined,
    q,
    limit: q ? 400 : 200,
  });
  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
