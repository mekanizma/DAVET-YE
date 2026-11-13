import { createHmac, timingSafeEqual } from "crypto";
import { siteUrl } from "@/lib/seo";

const API = "https://api.shopier.com/v1";

export interface ShopierCheckout {
  productId: string;
  productUrl: string;
  slug: string;
}

interface RemoteLine {
  productId?: string;
  title?: string;
  price?: string;
  total?: string;
}

interface RemoteOrder {
  id?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  totals?: { total?: string };
  lineItems?: RemoteLine[];
}

export interface ShopierPaid {
  id: string;
  productId: string;
  amount: number;
}

export function shopierConfigured(): boolean {
  return Boolean(process.env.SHOPIER_PAT?.trim());
}

function pat(): string {
  const token = process.env.SHOPIER_PAT?.trim() || "";
  if (!token) throw new Error("Shopier anahtarı tanımlı değil.");
  return token;
}

async function shopier<T>(path: string, init?: { method?: string; body?: unknown }): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method || "GET",
    headers: {
      Authorization: `Bearer ${pat()}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!text) return { status: res.status, data: null };
  try {
    return { status: res.status, data: JSON.parse(text) as T };
  } catch {
    return { status: res.status, data: null };
  }
}

function tl(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Number(value.trim().replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function shopierDate(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

let slugCache = "";

export async function shopierShopSlug(): Promise<string> {
  const fromEnv = process.env.SHOPIER_SHOP_SLUG?.trim() || "";
  if (/^[a-z0-9_-]+$/i.test(fromEnv) && !/^\d+$/.test(fromEnv)) return fromEnv;
  if (slugCache) return slugCache;
  const { status, data } = await shopier<{ url?: string }>("/shop/settings");
  if (status !== 200) throw new Error("Shopier mağaza bilgisi alınamadı.");
  const slug = String(data?.url || "").split("/").filter(Boolean).pop() || "";
  if (!/^[a-z0-9_-]+$/i.test(slug) || /^\d+$/.test(slug)) throw new Error("Shopier mağaza adresi okunamadı.");
  slugCache = slug;
  return slug;
}

function imageUrl(): string {
  const fromEnv = process.env.SHOPIER_IMAGE_URL?.trim() || "";
  if (/^https:\/\//i.test(fromEnv)) return fromEnv;
  return `${siteUrl()}/og.jpg`;
}

export async function deleteShopierProduct(productId: string) {
  if (!/^\d+$/.test(productId)) return;
  await shopier(`/products/${productId}`, { method: "DELETE" });
}

export async function createShopierCheckout(input: {
  code: string;
  kind: "davetiye" | "gazete";
  total: number;
  previousProductId?: string;
}): Promise<ShopierCheckout> {
  if (!Number.isInteger(input.total) || input.total <= 0) throw new Error("Ödenecek tutar geçersiz.");
  const slug = await shopierShopSlug();
  if (input.previousProductId) await deleteShopierProduct(input.previousProductId);
  const label = input.kind === "gazete" ? "Dijital gazete" : "Dijital davetiye";
  const { status, data } = await shopier<{ id?: string; url?: string }>("/products", {
    method: "POST",
    body: {
      title: `${label} ${input.code}`.slice(0, 100),
      description: `Tek kullanımlık dijital sipariş ${input.code}.`,
      type: "digital",
      shippingPayer: "sellerPays",
      priceData: { currency: "TRY", price: input.total.toFixed(2) },
      stockQuantity: 1,
      customListing: true,
      media: [{ type: "image", url: imageUrl(), placement: 1 }],
    },
  });
  const productId = String(data?.id || "");
  if (status < 200 || status >= 300 || !/^\d+$/.test(productId)) {
    throw new Error("Shopier ödeme sayfası açılamadı.");
  }
  return {
    productId,
    productUrl: `https://www.shopier.com/${productId}`,
    slug,
  };
}

function asOrders(data: unknown): RemoteOrder[] {
  if (Array.isArray(data)) return data as RemoteOrder[];
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: RemoteOrder[] }).items;
  }
  return [];
}

export function shopierPaidHit(remote: unknown, expect: { code?: string; total?: number; productId?: string; assumePaid?: boolean }): ShopierPaid | null {
  if (!remote || typeof remote !== "object") return null;
  const order = remote as RemoteOrder;
  if (order.paymentStatus === "unpaid") return null;
  const paid = order.paymentStatus === "paid" || order.paymentMethod === "debitCard" || order.paymentMethod === "creditCard" || Boolean(expect.assumePaid);
  if (!paid) return null;
  const code = expect.code?.trim().toUpperCase() || "";
  for (const line of order.lineItems || []) {
    const productId = String(line.productId || "");
    const title = String(line.title || "").toUpperCase();
    const linked = (expect.productId && productId === expect.productId) || (code && title.includes(code));
    if (!linked || !productId) continue;
    const amount = tl(line.total) ?? tl(line.price) ?? tl(order.totals?.total);
    if (amount == null) continue;
    if (expect.total != null && amount !== expect.total) continue;
    if (!order.id) continue;
    return { id: String(order.id), productId, amount };
  }
  return null;
}

export async function listShopierOrdersSince(sinceIso: string): Promise<unknown[]> {
  const since = Date.parse(sinceIso);
  const start = shopierDate(Number.isFinite(since) ? since - 120_000 : Date.now() - 2 * 24 * 60 * 60 * 1000);
  const end = shopierDate(Date.now() + 60_000);
  const { status, data } = await shopier<unknown>(`/orders?dateStart=${encodeURIComponent(start)}&dateEnd=${encodeURIComponent(end)}&limit=50`);
  if (status !== 200) return [];
  return asOrders(data);
}

export async function findPaidShopierOrder(input: { productId: string; code: string; since: string; total: number }): Promise<ShopierPaid | null> {
  for (const row of await listShopierOrdersSince(input.since)) {
    const hit = shopierPaidHit(row, input);
    if (hit) return hit;
  }
  return null;
}

export async function readShopierOrder(orderId: string): Promise<unknown | null> {
  const id = orderId.trim();
  if (!id || id.length > 40) return null;
  const { status, data } = await shopier<unknown>(`/orders/${encodeURIComponent(id)}`);
  if (status !== 200) return null;
  return data;
}

function signatures(token: string, body: string): string[] {
  const mac = createHmac("sha256", token).update(body);
  return [mac.digest("hex"), createHmac("sha256", token).update(body).digest("base64")];
}

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

export function verifyShopierWebhook(raw: string, signature: string): boolean {
  const token = process.env.SHOPIER_WEBHOOK_TOKEN?.trim() || "";
  const given = signature.trim();
  if (!token || !given) return false;
  return signatures(token, raw).some((expected) => same(expected, given));
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] || ch);
}

export function shopierCheckoutHtml(checkout: ShopierCheckout): string {
  const productId = esc(checkout.productId);
  const slug = esc(encodeURIComponent(checkout.slug));
  const productUrl = esc(checkout.productUrl);
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
    <form id="shopier" method="post" action="https://www.shopier.com/s/shipping/${slug}">
      <input type="hidden" name="product_id" value="${productId}">
      <input type="hidden" name="quantity" value="1">
      <button type="submit">Ödemeye devam et</button>
    </form>
    <p><a href="${productUrl}">Sayfa açılmazsa buraya dokunun</a></p>
  </main>
  <script>document.getElementById("shopier").submit();</script>
</body>
</html>`;
}

export function shopierMessageHtml(message: string): string {
  const text = esc(message);
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ödeme</title>
  <style>
    body { margin: 0; font-family: Georgia, serif; background: #f6f1e8; color: #1c241c; }
    main { max-width: 28rem; margin: 0 auto; padding: 2.5rem 1.25rem; }
    a { color: #1c241c; }
  </style>
</head>
<body>
  <main>
    <p>${text}</p>
    <p><a href="/panel">Panele dön</a></p>
  </main>
</body>
</html>`;
}
