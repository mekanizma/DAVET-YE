import { NextResponse } from "next/server";
import { findOrderForCustomer, saveShopierProduct, syncShopierPayment } from "@/lib/store";
import { createShopierCheckout, deleteShopierProduct, shopierCheckoutHtml, shopierConfigured, shopierMessageHtml, shopierShopSlug } from "@/lib/shopier";

export const dynamic = "force-dynamic";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 10 * 60 * 1000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 12;
}

function html(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return html(shopierMessageHtml("Çok fazla deneme. Biraz sonra yeniden deneyin."), 429);
  const { code } = await ctx.params;
  let email = "";
  let fresh = false;
  try {
    const type = req.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      const body = (await req.json()) as { email?: string; fresh?: boolean };
      email = String(body.email || "");
      fresh = Boolean(body.fresh);
    } else {
      const form = await req.formData();
      email = String(form.get("email") || "");
      fresh = form.get("fresh") === "1";
    }
  } catch {
    return html(shopierMessageHtml("Ödeme isteği okunamadı."), 400);
  }
  if (!shopierConfigured()) return html(shopierMessageHtml("Kart ödemesi henüz açılmadı."), 503);
  const known = await findOrderForCustomer(code, email);
  if (!known) return html(shopierMessageHtml("Sipariş bulunamadı. Kod ve e-posta birlikte kontrol edilir."), 404);
  const order = await syncShopierPayment(known);
  if (order.status === "onaylandi" || order.total <= 0) {
    return html(shopierMessageHtml("Bu siparişin ödemesi alınmış."));
  }
  if (order.status !== "bekliyor" && order.status !== "reddedildi") {
    return html(shopierMessageHtml("Bu sipariş için ödeme alınamıyor."), 400);
  }
  try {
    const reuse = !fresh && order.snapshot.__shopier && order.snapshot.__shopierAmount === String(order.total) ? order.snapshot.__shopier : "";
    if (reuse) {
      const slug = await shopierShopSlug();
      return html(shopierCheckoutHtml({ productId: reuse, productUrl: `https://www.shopier.com/${reuse}`, slug }));
    }
    const checkout = await createShopierCheckout({
      code: order.code,
      kind: order.kind,
      total: order.total,
      previousProductId: order.snapshot.__shopier,
    });
    const saved = await saveShopierProduct(order.code, order.customer.email, checkout.productId);
    if (!saved) {
      await deleteShopierProduct(checkout.productId);
      return html(shopierMessageHtml("Sipariş eşleştirilemedi."), 500);
    }
    return html(shopierCheckoutHtml(checkout));
  } catch (error) {
    console.error(error);
    return html(shopierMessageHtml("Shopier ödeme sayfası açılamadı. Biraz sonra yeniden deneyin."), 502);
  }
}
