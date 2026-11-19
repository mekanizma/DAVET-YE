import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { isStudioDownloadOrder } from "@/lib/catalog";
import { siteUrl } from "@/lib/seo";
import type { OrderRecord } from "@/lib/orderTypes";

const PAY_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";

export function shopierClassicConfigured(): boolean {
  return Boolean(process.env.SHOPIER_API_KEY?.trim() && process.env.SHOPIER_API_SECRET?.trim());
}

function apiKey(): string {
  return process.env.SHOPIER_API_KEY?.trim() || "";
}

function apiSecret(): string {
  return process.env.SHOPIER_API_SECRET?.trim() || "";
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] || ch);
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Musteri", last: "Davetanisi" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function phoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits || "5000000000";
}

export function buildClassicShopierFields(order: OrderRecord): Record<string, string> {
  const key = apiKey();
  const secret = apiSecret();
  if (!key || !secret) throw new Error("Shopier API anahtarı tanımlı değil.");
  if (!Number.isInteger(order.total) || order.total <= 0) throw new Error("Ödenecek tutar geçersiz.");

  const { first, last } = splitName(order.customer.name || order.senderName || "Musteri");
  const randomNr = String(randomInt(100000, 999999));
  const total = order.total.toFixed(2);
  const currency = "0"; // TRY
  const productName = `${
    isStudioDownloadOrder(order) ? "Filigransız kart" : order.kind === "gazete" ? "Dijital gazete" : "Dijital davetiye"
  } ${order.code}`.slice(0, 100);
  const callback = `${siteUrl()}/api/shopier/callback`;
  const signature = createHmac("sha256", secret)
    .update(randomNr + order.code + total + currency)
    .digest("base64");

  return {
    API_key: key,
    website_index: "1",
    platform_order_id: order.code,
    product_name: productName,
    product_type: "1",
    buyer_name: first.slice(0, 50),
    buyer_surname: last.slice(0, 50),
    buyer_email: order.customer.email.slice(0, 100),
    buyer_account_age: "0",
    buyer_id_nr: order.code,
    buyer_phone: phoneDigits(order.customer.phone),
    billing_address: "Davetanisi dijital teslimat",
    billing_city: "Istanbul",
    billing_country: "Turkey",
    billing_postcode: "34000",
    shipping_address: "Davetanisi dijital teslimat",
    shipping_city: "Istanbul",
    shipping_country: "Turkey",
    shipping_postcode: "34000",
    total_order_value: total,
    currency,
    platform: "0",
    is_in_frame: "0",
    current_language: "0",
    modul_version: "1.0.4",
    random_nr: randomNr,
    signature,
    callback,
  };
}

export function classicShopierCheckoutHtml(order: OrderRecord): string {
  const fields = buildClassicShopierFields(order);
  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`)
    .join("\n      ");
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shopier ödemesi</title>
  <style>
    body { margin: 0; font-family: Georgia, serif; background: #f6f1e8; color: #1c241c; }
    main { max-width: 28rem; margin: 0 auto; padding: 2.5rem 1.25rem; text-align: center; }
    a, button { font: inherit; }
    a { color: #1c241c; }
  </style>
</head>
<body>
  <main>
    <p>Güvenli kart ödeme sayfasına geçiliyor…</p>
    <form id="shopier" method="post" action="${PAY_URL}">
      ${inputs}
      <button type="submit">Ödemeye devam et</button>
    </form>
    <p><a href="/panel">Panele dön</a></p>
  </main>
  <script>document.getElementById("shopier").submit();</script>
</body>
</html>`;
}

export function verifyClassicShopierCallback(post: Record<string, string>): boolean {
  const secret = apiSecret();
  const orderId = String(post.platform_order_id || "").trim();
  const randomNr = String(post.random_nr || "").trim();
  const signature = String(post.signature || "").trim();
  if (!secret || !orderId || !randomNr || !signature) return false;
  const expected = createHmac("sha256", secret).update(randomNr + orderId).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  if (given.length !== expected.length || given.length === 0) return false;
  return timingSafeEqual(given, expected);
}
