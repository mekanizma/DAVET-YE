import { NextResponse } from "next/server";
import { findOrderByCode, findOrderForCustomer, saveShopierProduct, syncShopierPayment } from "@/lib/store";
import { createShopierCheckout, deleteShopierProduct, shopierCheckoutHtml, shopierConfigured, shopierMessageHtml, shopierShopSlug } from "@/lib/shopier";

export const dynamic = "force-dynamic";

const hits = new Map<string, { n: number; at: number }>();

function visitorIp(req: Request): string {
  // Cloudflare overwrites these with the real visitor. x-forwarded-for is the edge address, shared by everyone.
  for (const name of ["cf-connecting-ip", "true-client-ip"]) {
    const ip = req.headers.get(name)?.split(",")[0]?.trim() || "";
    if (ip.length > 0 && ip.length <= 64 && /^[0-9a-f:.]+$/i.test(ip)) return ip;
  }
  return "";
}

function limited(ip: string): boolean {
  if (!ip) return false;
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

async function start(req: Request, code: string, email: string, fresh: boolean) {
  if (limited(visitorIp(req))) return html(shopierMessageHtml("Çok fazla deneme. Biraz sonra yeniden deneyin."));
  if (!shopierConfigured()) return html(shopierMessageHtml("Kart ödemesi henüz açılmadı."));
  const known = email ? await findOrderForCustomer(code, email) : await findOrderByCode(code);
  if (!known) return html(shopierMessageHtml("Sipariş bulunamadı. Kod ve e-posta birlikte kontrol edilir."), 404);
  const order = await syncShopierPayment(known);
  if (order.status === "onaylandi" || order.total <= 0) {
    return html(shopierMessageHtml("Bu siparişin ödemesi alınmış."));
  }
  if (order.status !== "bekliyor" && order.status !== "reddedildi") {
    return html(shopierMessageHtml("Bu sipariş için ödeme alınamıyor."), 400);
  }
  const existing =
    order.snapshot.__shopier && order.snapshot.__shopierAmount === String(order.total) ? order.snapshot.__shopier : "";

  async function openExisting(productId: string) {
    const slug = await shopierShopSlug();
    return html(shopierCheckoutHtml({ productId, productUrl: `https://www.shopier.com/${productId}`, slug }));
  }

  try {
    if (existing && !fresh) return openExisting(existing);

    try {
      const checkout = await createShopierCheckout({
        code: order.code,
        kind: order.kind,
        total: order.total,
        previousProductId: order.snapshot.__shopier,
      });
      const saved = await saveShopierProduct(order.code, order.customer.email, checkout.productId);
      if (!saved) {
        await deleteShopierProduct(checkout.productId);
        if (existing) return openExisting(existing);
        return html(shopierMessageHtml("Sipariş eşleştirilemedi."));
      }
      return html(shopierCheckoutHtml(checkout));
    } catch (error) {
      console.error(error);
      if (existing) return openExisting(existing);
      const detail = error instanceof Error ? error.message : "";
      const codeMatch = /\((\d+)\)/.exec(detail);
      const status = codeMatch?.[1] || "";
      if (status === "401" || status === "403") {
        return html(shopierMessageHtml("Kart ödeme anahtarı Shopier tarafından reddedildi. Render’daki SHOPIER_PAT değerini kontrol edin."));
      }
      if (status === "429") {
        return html(shopierMessageHtml("Shopier şu an yoğun. Biraz sonra yeniden deneyin."));
      }
      return html(shopierMessageHtml("Shopier ödeme sayfası açılamadı. Biraz sonra yeniden deneyin."));
    }
  } catch (error) {
    console.error(error);
    return html(shopierMessageHtml("Shopier ödeme sayfası açılamadı. Biraz sonra yeniden deneyin."));
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "";
  const fresh = url.searchParams.get("yeni") === "1";
  return start(req, code, email, fresh);
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
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
  return start(req, code, email, fresh);
}
