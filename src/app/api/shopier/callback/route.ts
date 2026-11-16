import { NextResponse } from "next/server";
import { confirmShopierPayment, findOrderByCode } from "@/lib/store";
import { shopierMessageHtml } from "@/lib/shopier";
import { verifyClassicShopierCallback } from "@/lib/shopierClassic";

export const dynamic = "force-dynamic";

function html(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function handle(post: Record<string, string>) {
  if (!verifyClassicShopierCallback(post)) {
    return html(shopierMessageHtml("Ödeme doğrulanamadı."), 401);
  }
  const code = String(post.platform_order_id || "").trim().toUpperCase();
  const status = String(post.status || "").trim().toLowerCase();
  const paymentId = String(post.payment_id || post.paymentId || "").trim();
  if (!code) return html(shopierMessageHtml("Sipariş kodu eksik."), 400);
  if (status && status !== "success") {
    return html(shopierMessageHtml("Ödeme tamamlanmadı. Panele dönüp yeniden deneyebilirsiniz."));
  }
  const order = await findOrderByCode(code);
  if (!order) return html(shopierMessageHtml("Sipariş bulunamadı."), 404);
  if (order.status === "onaylandi") {
    return NextResponse.redirect(new URL(`/panel?odeme=${encodeURIComponent(code)}`, process.env.NEXT_PUBLIC_SITE_URL || "https://davetanisi.com"), 303);
  }
  const saved = await confirmShopierPayment({
    code: order.code,
    shopierOrderId: paymentId || `classic-${code}`,
    amount: order.total,
  });
  if (!saved) return html(shopierMessageHtml("Ödeme alındı ama sipariş güncellenemedi. Destek ile iletişime geçin."), 500);
  return NextResponse.redirect(new URL(`/panel?odeme=${encodeURIComponent(code)}`, process.env.NEXT_PUBLIC_SITE_URL || "https://davetanisi.com"), 303);
}

export async function POST(req: Request) {
  try {
    const type = req.headers.get("content-type") || "";
    const post: Record<string, string> = {};
    if (type.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(body || {})) post[k] = String(v ?? "");
    } else {
      const form = await req.formData();
      form.forEach((value, key) => {
        post[key] = String(value);
      });
    }
    return handle(post);
  } catch (error) {
    console.error(error);
    return html(shopierMessageHtml("Ödeme dönüşü okunamadı."), 400);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const post: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    post[key] = value;
  });
  if (!post.platform_order_id) {
    return html(shopierMessageHtml("Ödeme dönüşü eksik."));
  }
  return handle(post);
}
