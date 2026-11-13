import { NextResponse } from "next/server";
import { listOrders, syncPendingShopierPayments } from "@/lib/store";
import { isOrderStatus } from "@/lib/orderStatus";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const durum = url.searchParams.get("durum") || "";
  const q = (url.searchParams.get("q") || "").trim().toLocaleLowerCase("tr");
  await syncPendingShopierPayments();
  let orders = await listOrders();
  if (isOrderStatus(durum)) orders = orders.filter((o) => o.status === durum);
  if (q) {
    orders = orders.filter((o) => {
      const blob = `${o.code} ${o.title} ${o.customer.name} ${o.customer.email} ${o.customer.phone} ${o.senderName}`.toLocaleLowerCase("tr");
      return blob.includes(q);
    });
  }
  return NextResponse.json({ orders: orders.slice(0, 300) });
}
