import { randomInt } from "crypto";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { ADDONS } from "@/data/pricing";
import { newspapers } from "@/data/newspapers";
import { themes } from "@/data/themes";
import {
  DEFAULT_SETTINGS,
  STUDIO_PRICE_DEFAULT,
  buildPublicCatalog,
  defaultAddon,
  defaultThemeLive,
  type AddonOverride,
  type PaperOverride,
  type PaymentSettings,
  type PublicCatalog,
  type ThemeOverride,
} from "@/lib/catalog";
import { asDbOrder, toOrder, type DbOrder } from "@/lib/orderRow";
import type { OrderStatus } from "@/lib/orderStatus";
import type { OrderLine, OrderRecord } from "@/lib/orderTypes";
import { invitationQuote, paperQuote } from "@/lib/pricing";
import { publishShare, releaseShare } from "@/lib/shareLink";
import { deleteShopierProduct, findPaidShopierOrder, listShopierOrdersSince, shopierPaidHit } from "@/lib/shopier";
import { createSupabaseAnon, createSupabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";

export type { OrderLine, OrderRecord };

interface ThemeRow {
  slug: string;
  price: number | null;
  compare_at: number | null;
  featured: boolean | null;
  hidden: boolean | null;
  badge: string | null;
}

interface PaperRow {
  slug: string;
  price: number | null;
  compare_at: number | null;
  hidden: boolean | null;
}

interface AddonRow {
  id: string;
  title: string | null;
  note: string | null;
  blurb: string | null;
  price: number | null;
  was: number | null;
  was_set: boolean;
  active: boolean | null;
  included: boolean | null;
}

interface SettingsRow {
  bank_name: string;
  account_holder: string;
  iban: string;
  instructions: string;
  support_email: string;
  support_phone: string;
}

interface SiteRow {
  studio_price: number | null;
  features: string[] | null;
}

function money(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(500_000, Math.round(n)));
}

function clean(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    throw new Error("Bu işlem için yönetici girişi gerekli.");
  }
  throw new Error(error.message);
}

let catalogMemo: { at: number; data: PublicCatalog } | null = null;

function refresh() {
  catalogMemo = null;
  try {
    revalidatePath("/", "layout");
  } catch {
    /* called outside a request */
  }
}

function serverSecret(): string {
  const secret = process.env.SUPABASE_SERVER_SECRET;
  if (!secret) throw new Error("Sunucu gizli anahtarı tanımlı değil.");
  return secret;
}

async function readCatalog(): Promise<{
  settings: PaymentSettings;
  themeOverrides: Record<string, ThemeOverride>;
  paperOverrides: Record<string, PaperOverride>;
  addonOverrides: Record<string, AddonOverride>;
  studioPrice: number | null;
  features: string[] | null;
}> {
  const db = createSupabaseAnon();
  const [settingsRes, themeRes, paperRes, addonRes, siteRes] = await Promise.all([
    db.from("dv_payment_settings").select("bank_name, account_holder, iban, instructions, support_email, support_phone").eq("id", 1).maybeSingle(),
    db.from("dv_theme_overrides").select("slug, price, compare_at, featured, hidden, badge"),
    db.from("dv_paper_overrides").select("slug, price, compare_at, hidden"),
    db.from("dv_addon_overrides").select("id, title, note, blurb, price, was, was_set, active, included"),
    db.from("dv_site_config").select("studio_price, features").eq("id", 1).maybeSingle(),
  ]);
  check(settingsRes.error);
  check(themeRes.error);
  check(paperRes.error);
  check(addonRes.error);
  check(siteRes.error);

  const s = (settingsRes.data || {}) as Partial<SettingsRow>;
  const settings: PaymentSettings = {
    bankName: clean(s.bank_name, 80),
    accountHolder: clean(s.account_holder, 80),
    iban: clean(s.iban, 40).replace(/\s+/g, "").toUpperCase(),
    instructions: clean(s.instructions, 600) || DEFAULT_SETTINGS.instructions,
    supportEmail: clean(s.support_email, 120),
    supportPhone: clean(s.support_phone, 30),
  };

  const themeOverrides: Record<string, ThemeOverride> = {};
  for (const row of (themeRes.data || []) as ThemeRow[]) {
    const next: ThemeOverride = {};
    if (row.price != null) next.price = row.price;
    if (row.compare_at != null) next.compareAt = row.compare_at;
    if (row.featured != null) next.featured = row.featured;
    if (row.hidden != null) next.hidden = row.hidden;
    if (row.badge != null) next.badge = row.badge === "featured" || row.badge === "new" ? row.badge : "";
    if (Object.keys(next).length) themeOverrides[row.slug] = next;
  }

  const paperOverrides: Record<string, PaperOverride> = {};
  for (const row of (paperRes.data || []) as PaperRow[]) {
    const next: PaperOverride = {};
    if (row.price != null) next.price = row.price;
    if (row.compare_at != null) next.compareAt = row.compare_at;
    if (row.hidden != null) next.hidden = row.hidden;
    if (Object.keys(next).length) paperOverrides[row.slug] = next;
  }

  const addonOverrides: Record<string, AddonOverride> = {};
  for (const row of (addonRes.data || []) as AddonRow[]) {
    const next: AddonOverride = {};
    if (row.title != null) next.title = row.title;
    if (row.note != null) next.note = row.note;
    if (row.blurb != null) next.text = row.blurb;
    if (row.price != null) next.price = row.price;
    if (row.was_set) next.was = row.was;
    if (row.active != null) next.active = row.active;
    if (row.included != null) next.included = row.included;
    if (Object.keys(next).length) addonOverrides[row.id] = next;
  }

  const site = (siteRes.data || {}) as Partial<SiteRow>;
  return {
    settings,
    themeOverrides,
    paperOverrides,
    addonOverrides,
    studioPrice: site.studio_price == null ? null : money(site.studio_price, STUDIO_PRICE_DEFAULT),
    features: Array.isArray(site.features) ? site.features.map((x) => clean(x, 160)).filter(Boolean).slice(0, 12) : null,
  };
}

export const getPublicCatalog = cache(async (): Promise<PublicCatalog> => {
  noStore();
  if (catalogMemo && Date.now() - catalogMemo.at < 20_000) return catalogMemo.data;
  const s = await readCatalog();
  const data = buildPublicCatalog({
    settings: s.settings,
    themeOverrides: s.themeOverrides,
    paperOverrides: s.paperOverrides,
    addonOverrides: s.addonOverrides,
    studioPrice: s.studioPrice ?? undefined,
    features: s.features,
  });
  catalogMemo = { at: Date.now(), data };
  return data;
});

export async function listOrders(): Promise<OrderRecord[]> {
  noStore();
  const db = await createSupabaseServer();
  const { data, error } = await db.from("dv_orders").select("*").order("created_at", { ascending: false }).limit(2000);
  check(error);
  return ((data || []) as DbOrder[]).map(toOrder);
}

const ORDER_CARD = "code, status, kind, template, title, total, created_at, updated_at, reported_at, decided_at, sender_name, customer_name, customer_email, customer_phone, dekont:snapshot->>__dekont";

function cardOrder(row: DbOrder & { dekont?: string | null }): OrderRecord {
  const dekont = row.dekont ? String(row.dekont) : "";
  return toOrder({
    ...row,
    lines: [],
    customer_note: "",
    admin_note: "",
    snapshot: dekont ? { __dekont: dekont } : {},
  });
}

/** Order list rows without the invitation snapshot or line items. */
export async function listOrderCards(): Promise<OrderRecord[]> {
  noStore();
  const db = await createSupabaseServer();
  const { data, error } = await db.from("dv_orders").select(ORDER_CARD).order("created_at", { ascending: false }).limit(2000);
  check(error);
  return ((data || []) as (DbOrder & { dekont?: string | null })[]).map(cardOrder);
}

/** Counts and the latest orders for the admin home. Skips the full catalog and full snapshots. */
export async function deskSummary() {
  noStore();
  const db = await createSupabaseServer();
  const [statRes, recentRes, hiddenRes] = await Promise.all([
    db.from("dv_orders").select("status, total"),
    db.from("dv_orders").select(ORDER_CARD).order("created_at", { ascending: false }).limit(8),
    db.from("dv_theme_overrides").select("slug").eq("hidden", true),
  ]);
  check(statRes.error);
  check(recentRes.error);
  check(hiddenRes.error);
  const stats = (statRes.data || []) as { status: string; total: number }[];
  const sum = (status: string) => stats.filter((o) => o.status === status).length;
  const known = new Set(themes.map((t) => t.slug));
  const hiddenThemes = ((hiddenRes.data || []) as { slug: string }[]).filter((row) => known.has(row.slug)).length;
  return {
    paymentReady: Boolean(process.env.SHOPIER_PAT?.trim()),
    counts: {
      bekliyor: sum("bekliyor"),
      bildirildi: sum("bildirildi"),
      onaylandi: sum("onaylandi"),
      reddedildi: sum("reddedildi"),
      themes: themes.length,
      hiddenThemes,
      newspapers: newspapers.length,
    },
    approvedTotal: stats.filter((o) => o.status === "onaylandi").reduce((s, o) => s + (Number(o.total) || 0), 0),
    recent: ((recentRes.data || []) as (DbOrder & { dekont?: string | null })[]).map(cardOrder),
  };
}

export async function findOrder(code: string): Promise<OrderRecord | undefined> {
  noStore();
  const db = await createSupabaseServer();
  const { data, error } = await db.from("dv_orders").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  check(error);
  return data ? toOrder(data as DbOrder) : undefined;
}

async function orderForCustomer(code: string, email: string): Promise<DbOrder | null> {
  const { data, error } = await createSupabaseAnon().rpc("dv_order_for_customer", {
    order_code: code.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
    server_secret: serverSecret(),
  });
  check(error);
  return asDbOrder(data);
}

async function upsertOrder(order: OrderRecord, userId: string | null): Promise<OrderRecord> {
  const { data, error } = await createSupabaseAnon().rpc("dv_order_upsert", {
    payload: {
      code: order.code,
      status: order.status,
      kind: order.kind,
      template: order.template,
      title: order.title,
      total: order.total,
      lines: order.lines,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      reportedAt: order.reportedAt,
      decidedAt: order.decidedAt,
      senderName: order.senderName,
      customerNote: order.customerNote,
      adminNote: order.adminNote,
      customer: order.customer,
      snapshot: order.snapshot,
      userId,
    },
    server_secret: serverSecret(),
  });
  check(error);
  const row = asDbOrder(data);
  if (!row) throw new Error("Sipariş kaydedilemedi.");
  refresh();
  return toOrder(row);
}

function newCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < 8; i++) body += alphabet[randomInt(alphabet.length)];
  return `DV-${body}`;
}

export interface CreateOrderInput {
  kind: "davetiye" | "gazete";
  template: string;
  languages: string[];
  addons: string[];
  customer: { name: string; email: string; phone: string };
  customerNote: string;
  snapshot: Record<string, string>;
  userId?: string | null;
}

export async function createOrderAsync(input: CreateOrderInput): Promise<{ ok: true; order: OrderRecord } | { ok: false; error: string }> {
  const cat = await getPublicCatalog();
  const template = clean(input.template, 80);
  let title = "";
  let lines: OrderLine[] = [];
  let total = 0;

  if (input.kind === "davetiye") {
    const theme = themes.find((t) => t.slug === template);
    const live = cat.themes[template];
    if (!theme || !live || live.hidden) return { ok: false, error: "Bu davetiye şu an satışta değil." };
    title = theme.title;
    const q = invitationQuote({ template, languages: input.languages, addons: input.addons }, cat);
    lines = q.lines;
    total = q.total;
  } else {
    const paper = newspapers.find((n) => n.slug === template);
    const live = cat.newspapers[template];
    if (!paper || !live || live.hidden) return { ok: false, error: "Bu gazete şu an satışta değil." };
    title = paper.title;
    const q = paperQuote(template, cat);
    lines = q.lines;
    total = q.total;
  }

  const customer = {
    name: clean(input.customer.name, 80),
    email: clean(input.customer.email, 120).toLowerCase(),
    phone: clean(input.customer.phone, 20),
  };
  if (customer.name.length < 3) return { ok: false, error: "Ad soyad en az 3 karakter olmalı." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) return { ok: false, error: "Geçerli bir e-posta yazın." };
  const digits = customer.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return { ok: false, error: "Telefon numarası eksik görünüyor." };

  const snapshot: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.snapshot || {}).slice(0, 12)) {
    const key = clean(k, 40);
    const val = clean(v, 400);
    if (key && val && !key.startsWith("__")) snapshot[key] = val;
  }

  const now = new Date().toISOString();
  const status: OrderStatus = total === 0 ? "onaylandi" : "bekliyor";
  const userId = input.userId || null;

  for (let attempt = 0; attempt < 4; attempt++) {
    const order: OrderRecord = {
      code: newCode(),
      status,
      kind: input.kind,
      template,
      title,
      total,
      lines,
      createdAt: now,
      updatedAt: now,
      reportedAt: null,
      decidedAt: status === "onaylandi" ? now : null,
      senderName: "",
      customerNote: clean(input.customerNote, 500),
      adminNote: status === "onaylandi" ? "Tutar sıfır olduğu için ödeme gerekmeden onaylandı." : "",
      customer,
      snapshot,
    };
    try {
      return { ok: true, order: await upsertOrder(order, userId) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (!/duplicate|23505|unique/i.test(msg) || attempt === 3) {
        console.error(e);
        return { ok: false, error: "Sipariş kaydedilemedi." };
      }
    }
  }
  return { ok: false, error: "Sipariş kaydedilemedi." };
}

export async function findOrderForCustomer(code: string, email: string): Promise<OrderRecord | undefined> {
  noStore();
  const row = await orderForCustomer(code, email);
  return row ? toOrder(row) : undefined;
}

export async function reportTransfer(
  code: string,
  email: string,
  senderName: string,
  receiptExt?: string,
): Promise<{ ok: true; order: OrderRecord } | { ok: false; error: string }> {
  const name = clean(senderName, 80);
  if (name.length < 3) return { ok: false, error: "Gönderen adını yazın." };
  const mail = clean(email, 120).toLowerCase();
  try {
    const row = await orderForCustomer(code, mail);
    if (!row) return { ok: false, error: "Sipariş bulunamadı. Kodu ve e-postayı kontrol edin." };
    const order = toOrder(row);
    if (order.status === "onaylandi") return { ok: false, error: "Bu sipariş zaten onaylanmış." };
    if (order.status !== "bekliyor" && order.status !== "reddedildi" && order.status !== "bildirildi") {
      return { ok: false, error: "Bu sipariş için bildirim alınamıyor." };
    }
    const now = new Date().toISOString();
    order.status = "bildirildi";
    order.senderName = name;
    order.reportedAt = now;
    order.updatedAt = now;
    order.decidedAt = null;
    if (receiptExt) order.snapshot = { ...order.snapshot, __dekont: receiptExt };
    return { ok: true, order: await upsertOrder(order, row.user_id || null) };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Bildirim kaydedilemedi." };
  }
}

export async function decideOrder(
  code: string,
  action: "onayla" | "reddet" | "not",
  adminNote: string,
): Promise<{ ok: true; order: OrderRecord } | { ok: false; error: string }> {
  const note = clean(adminNote, 500);
  try {
    const db = await createSupabaseServer();
    const { data, error } = await db.from("dv_orders").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
    check(error);
    if (!data) return { ok: false, error: "Sipariş bulunamadı." };
    const row = data as DbOrder;
    const order = toOrder(row);
    const now = new Date().toISOString();
    if (action === "not") {
      order.adminNote = note;
      order.updatedAt = now;
    } else {
      if (action === "onayla") order.status = "onaylandi";
      if (action === "reddet") order.status = "reddedildi";
      order.adminNote = note;
      order.decidedAt = now;
      order.updatedAt = now;
    }
    const saved = await upsertOrder(order, row.user_id || null);
    if (action === "onayla") await publishShare(saved);
    if (action === "reddet") await releaseShare(saved.code);
    return { ok: true, order: saved };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Karar kaydedilemedi." };
  }
}

function adminDb() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function findOrderByCode(code: string): Promise<OrderRecord | null> {
  const loaded = await loadOrderByCode(code);
  return loaded?.order ?? null;
}

async function loadOrderByCode(code: string): Promise<{ order: OrderRecord; userId: string | null } | null> {
  const db = adminDb();
  if (!db) return null;
  const { data, error } = await db.from("dv_orders").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  if (error || !data) return null;
  const row = data as DbOrder;
  return { order: toOrder(row), userId: row.user_id || null };
}

async function loadOrderByShopierProduct(productId: string): Promise<{ order: OrderRecord; userId: string | null } | null> {
  const db = adminDb();
  if (!db) return null;
  const { data, error } = await db.from("dv_orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (error || !data) return null;
  const row = (data as DbOrder[]).find((item) => item.snapshot?.__shopier === productId);
  if (!row) return null;
  return { order: toOrder(row), userId: row.user_id || null };
}

export async function saveShopierProduct(code: string, email: string, productId: string): Promise<OrderRecord | null> {
  const row = await orderForCustomer(code, email);
  if (!row) return null;
  const order = toOrder(row);
  order.snapshot = { ...order.snapshot, __shopier: productId, __shopierAmount: String(order.total) };
  order.updatedAt = new Date().toISOString();
  return upsertOrder(order, row.user_id || null);
}

export async function confirmShopierPayment(match: {
  code?: string;
  productId?: string;
  shopierOrderId: string;
  amount: number;
}): Promise<OrderRecord | null> {
  const byProduct = match.productId ? await loadOrderByShopierProduct(match.productId) : null;
  const loaded = byProduct || (match.code ? await loadOrderByCode(match.code) : null);
  if (!loaded) return null;
  const order = loaded.order;
  if (order.status === "onaylandi") return order;
  if (order.total <= 0 || match.amount !== order.total) return null;
  const now = new Date().toISOString();
  order.status = "onaylandi";
  order.decidedAt = now;
  order.updatedAt = now;
  order.adminNote = order.adminNote || "Shopier POS ile ödendi.";
  order.snapshot = { ...order.snapshot, __shopierOrder: match.shopierOrderId };
  if (match.productId) order.snapshot.__shopier = match.productId;
  const saved = await upsertOrder(order, loaded.userId);
  await publishShare(saved);
  if (match.productId) {
    try {
      await deleteShopierProduct(match.productId);
    } catch (error) {
      console.error(error);
    }
  }
  return saved;
}

let shopierSyncAt = 0;

/** Start a payment check, but do not let a slow Shopier response hold the admin page. */
export function nudgeShopierSync() {
  const run = syncPendingShopierPayments();
  return Promise.race([run, new Promise<void>((resolve) => setTimeout(resolve, 400))]);
}

export async function syncPendingShopierPayments() {
  if (Date.now() - shopierSyncAt < 45_000) return;
  shopierSyncAt = Date.now();
  const db = adminDb();
  if (!db) return;
  try {
    const { data, error } = await db.from("dv_orders").select("*").in("status", ["bekliyor", "reddedildi"]).order("created_at", { ascending: false }).limit(40);
    if (error || !data?.length) return;
    const pending = (data as DbOrder[]).map(toOrder).filter((order) => order.total > 0 && order.snapshot.__shopier);
    if (!pending.length) return;
    const oldest = pending.reduce((min, order) => (order.createdAt < min ? order.createdAt : min), pending[0].createdAt);
    const remote = await listShopierOrdersSince(oldest);
    for (const order of pending) {
      const hit = remote
        .map((row) => shopierPaidHit(row, { code: order.code, productId: order.snapshot.__shopier, total: order.total }))
        .find((item): item is NonNullable<typeof item> => Boolean(item));
      if (!hit) continue;
      await confirmShopierPayment({ code: order.code, productId: hit.productId, shopierOrderId: hit.id, amount: hit.amount });
    }
  } catch (error) {
    console.error(error);
  }
}

export async function syncShopierPayment(order: OrderRecord): Promise<OrderRecord> {
  if (order.status === "onaylandi" || order.total <= 0 || !order.snapshot.__shopier) return order;
  try {
    const hit = await findPaidShopierOrder({
      productId: order.snapshot.__shopier,
      code: order.code,
      since: order.createdAt,
      total: order.total,
    });
    if (!hit) return order;
    return (await confirmShopierPayment({ code: order.code, productId: hit.productId, shopierOrderId: hit.id, amount: hit.amount })) || order;
  } catch (error) {
    console.error(error);
    return order;
  }
}

export interface ThemeEdit {
  slug: string;
  price: number;
  compareAt: number;
  featured: boolean;
  hidden: boolean;
  badge: "" | "featured" | "new";
}

export async function saveThemes(items: ThemeEdit[]) {
  const db = await createSupabaseServer();
  const upserts: { slug: string; price: number | null; compare_at: number | null; featured: boolean | null; hidden: boolean | null; badge: string | null }[] = [];
  const clears: string[] = [];
  for (const item of items) {
    const theme = themes.find((t) => t.slug === item.slug);
    if (!theme) continue;
    const base = defaultThemeLive(theme);
    const next: ThemeOverride = {};
    const price = money(item.price, base.price);
    const compareAt = money(item.compareAt, base.compareAt);
    if (price !== base.price) next.price = price;
    if (compareAt !== base.compareAt) next.compareAt = compareAt;
    if (Boolean(item.featured) !== base.featured) next.featured = Boolean(item.featured);
    if (Boolean(item.hidden) !== base.hidden) next.hidden = Boolean(item.hidden);
    const badge = item.badge === "featured" || item.badge === "new" ? item.badge : "";
    if (badge !== base.badge) next.badge = badge;
    if (Object.keys(next).length) {
      upserts.push({
        slug: theme.slug,
        price: next.price ?? null,
        compare_at: next.compareAt ?? null,
        featured: next.featured ?? null,
        hidden: next.hidden ?? null,
        badge: next.badge ?? null,
      });
    } else clears.push(theme.slug);
  }
  const jobs: PromiseLike<void>[] = [];
  if (upserts.length) jobs.push(db.from("dv_theme_overrides").upsert(upserts).then(({ error }) => check(error)));
  if (clears.length) jobs.push(db.from("dv_theme_overrides").delete().in("slug", clears).then(({ error }) => check(error)));
  await Promise.all(jobs);
  refresh();
}

export interface PaperEdit {
  slug: string;
  price: number;
  compareAt: number;
  hidden: boolean;
}

export async function savePapers(items: PaperEdit[]) {
  const db = await createSupabaseServer();
  const upserts: { slug: string; price: number | null; compare_at: number | null; hidden: boolean | null }[] = [];
  const clears: string[] = [];
  for (const item of items) {
    const paper = newspapers.find((n) => n.slug === item.slug);
    if (!paper) continue;
    const next: PaperOverride = {};
    const price = money(item.price, paper.price);
    const compareAt = money(item.compareAt, paper.compareAt);
    if (price !== paper.price) next.price = price;
    if (compareAt !== paper.compareAt) next.compareAt = compareAt;
    if (Boolean(item.hidden)) next.hidden = true;
    if (Object.keys(next).length) {
      upserts.push({
        slug: paper.slug,
        price: next.price ?? null,
        compare_at: next.compareAt ?? null,
        hidden: next.hidden ?? null,
      });
    } else clears.push(paper.slug);
  }
  const jobs: PromiseLike<void>[] = [];
  if (upserts.length) jobs.push(db.from("dv_paper_overrides").upsert(upserts).then(({ error }) => check(error)));
  if (clears.length) jobs.push(db.from("dv_paper_overrides").delete().in("slug", clears).then(({ error }) => check(error)));
  await Promise.all(jobs);
  refresh();
}

export interface AddonEdit {
  id: string;
  title: string;
  note: string;
  text: string;
  price: number;
  was: number | null;
  active: boolean;
  included: boolean;
}

export async function savePricing(input: { addons: AddonEdit[]; studioPrice: number; features: string[] }) {
  const db = await createSupabaseServer();
  const upserts: { id: string; title: string | null; note: string | null; blurb: string | null; price: number | null; was: number | null; was_set: boolean; active: boolean | null; included: boolean | null }[] = [];
  const clears: string[] = [];
  for (const item of input.addons) {
    const baseAddon = ADDONS.find((a) => a.id === item.id);
    if (!baseAddon) continue;
    const base = defaultAddon(baseAddon);
    const next: AddonOverride = {};
    const title = clean(item.title, 80);
    const note = clean(item.note, 40);
    const text = clean(item.text, 280);
    const price = money(item.price, base.price);
    const was = item.was == null || item.was === ("" as unknown) ? null : money(item.was, base.was ?? 0);
    if (title && title !== base.title) next.title = title;
    if (note !== (base.note ?? "")) next.note = note;
    if (text && text !== base.text) next.text = text;
    if (price !== base.price) next.price = price;
    const baseWas = base.was ?? null;
    if (was !== baseWas) next.was = was;
    if (Boolean(item.active) !== base.active) next.active = Boolean(item.active);
    if (Boolean(item.included) !== base.included) next.included = Boolean(item.included);
    if (Object.keys(next).length) {
      upserts.push({
        id: baseAddon.id,
        title: next.title ?? null,
        note: next.note !== undefined ? next.note : null,
        blurb: next.text ?? null,
        price: next.price ?? null,
        was: next.was === undefined ? null : next.was,
        was_set: next.was !== undefined,
        active: next.active ?? null,
        included: next.included ?? null,
      });
    } else clears.push(baseAddon.id);
  }
  const studio = money(input.studioPrice, STUDIO_PRICE_DEFAULT);
  const features = input.features.map((x) => clean(x, 160)).filter(Boolean).slice(0, 12);
  const jobs: PromiseLike<void>[] = [
    db.from("dv_site_config").update({
      studio_price: studio === STUDIO_PRICE_DEFAULT ? null : studio,
      features: features.length ? features : null,
      updated_at: new Date().toISOString(),
    }).eq("id", 1).then(({ error }) => check(error)),
  ];
  if (upserts.length) jobs.push(db.from("dv_addon_overrides").upsert(upserts).then(({ error }) => check(error)));
  if (clears.length) jobs.push(db.from("dv_addon_overrides").delete().in("id", clears).then(({ error }) => check(error)));
  await Promise.all(jobs);
  refresh();
}

export async function saveSettings(input: PaymentSettings) {
  const db = await createSupabaseServer();
  const { error } = await db.from("dv_payment_settings").update({
    bank_name: clean(input.bankName, 80),
    account_holder: clean(input.accountHolder, 80),
    iban: clean(input.iban, 34).replace(/\s+/g, "").toUpperCase(),
    instructions: clean(input.instructions, 600) || DEFAULT_SETTINGS.instructions,
    support_email: clean(input.supportEmail, 120),
    support_phone: clean(input.supportPhone, 30),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  check(error);
  refresh();
}

export function orderMatchesEmail(order: OrderRecord, email: string): boolean {
  return order.customer.email === email.trim().toLowerCase();
}
