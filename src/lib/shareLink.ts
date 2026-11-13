import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/seo";
import { supabaseUrl } from "@/lib/supabase/env";
import type { OrderRecord } from "@/lib/orderTypes";
import { addMonths, sanitizeShareDesign, shareMonths, slugifyShare, type ShareKind, type SharePublic } from "@/lib/shareSlug";

const FILE = path.join(process.cwd(), "data", "runtime", "share-links.json");
const HOLD_DAYS = 14;

type ShareRow = {
  slug: string;
  orderCode: string;
  kind: ShareKind;
  template: string;
  locale: "tr" | "en";
  email: string;
  payload: Record<string, unknown>;
  status: "reserved" | "live";
  createdAt: string;
  liveAt: string | null;
  expiresAt: string;
};

function admin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function toPublic(row: ShareRow, now = Date.now()): SharePublic {
  const expired = Date.parse(row.expiresAt) <= now;
  const status = row.status === "live" && !expired ? "live" : row.status === "reserved" && !expired ? "reserved" : "expired";
  return {
    slug: row.slug,
    url: `${siteUrl()}/d/${row.slug}`,
    kind: row.kind,
    status,
    expiresAt: row.status === "live" ? row.expiresAt : null,
  };
}

function fromDb(row: Record<string, unknown>): ShareRow {
  return {
    slug: String(row.slug || ""),
    orderCode: String(row.order_code || ""),
    kind: row.kind === "gazete" ? "gazete" : "davetiye",
    template: String(row.template || ""),
    locale: row.locale === "en" ? "en" : "tr",
    email: String(row.email || ""),
    payload: row.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload as Record<string, unknown> : {},
    status: row.status === "live" ? "live" : "reserved",
    createdAt: String(row.created_at || ""),
    liveAt: row.live_at ? String(row.live_at) : null,
    expiresAt: String(row.expires_at || ""),
  };
}

function toDb(row: ShareRow) {
  return {
    slug: row.slug,
    order_code: row.orderCode,
    kind: row.kind,
    template: row.template,
    locale: row.locale,
    email: row.email,
    payload: row.payload,
    status: row.status,
    created_at: row.createdAt,
    live_at: row.liveAt,
    expires_at: row.expiresAt,
  };
}

async function readLocal(): Promise<ShareRow[]> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(rows: ShareRow[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows));
}

function freshSlug(hint: string, taken: Set<string>) {
  const base = slugifyShare(hint) || "davet";
  if (!taken.has(base)) return base;
  for (let i = 2; i < 40; i++) {
    const next = slugifyShare(`${base}-${i}`);
    if (next && !taken.has(next)) return next;
  }
  return slugifyShare(`${base}-${Date.now().toString(36).slice(-4)}`) || `davet-${Date.now().toString(36).slice(-4)}`;
}

function openRows(rows: ShareRow[], now = Date.now()) {
  return rows.filter((row) => Date.parse(row.expiresAt) > now);
}

export async function reserveShare(input: {
  order: OrderRecord;
  hint?: string;
  design?: unknown;
  locale?: "tr" | "en";
}): Promise<SharePublic | null> {
  try {
    const now = new Date();
    const locale = input.locale === "en" ? "en" : "tr";
    const payload = sanitizeShareDesign(input.order.kind, input.design);
    const live = input.order.status === "onaylandi";
    const expiresAt = live
      ? addMonths(now.toISOString(), shareMonths(input.order.kind))
      : new Date(now.getTime() + HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const hint = input.hint || input.order.snapshot["İsimler"] || input.order.snapshot.Names || input.order.title;
    const db = admin();
    if (!db) {
      const rows = await readLocal();
      const current = rows.find((row) => row.orderCode === input.order.code);
      if (current) {
        current.payload = payload;
        current.locale = locale;
        if (live && current.status !== "live") {
          current.status = "live";
          current.liveAt = now.toISOString();
          current.expiresAt = expiresAt;
        }
        await writeLocal(rows);
        return toPublic(current);
      }
      const slug = freshSlug(hint, new Set(openRows(rows).map((row) => row.slug)));
      const row: ShareRow = {
        slug,
        orderCode: input.order.code,
        kind: input.order.kind,
        template: input.order.template,
        locale,
        email: input.order.customer.email,
        payload,
        status: live ? "live" : "reserved",
        createdAt: now.toISOString(),
        liveAt: live ? now.toISOString() : null,
        expiresAt,
      };
      rows.push(row);
      await writeLocal(rows);
      return toPublic(row);
    }

    const { data: existing } = await db.from("dv_share_links").select("*").eq("order_code", input.order.code).maybeSingle();
    if (existing) {
      const row = fromDb(existing as Record<string, unknown>);
      row.payload = payload;
      row.locale = locale;
      if (live && row.status !== "live") {
        row.status = "live";
        row.liveAt = now.toISOString();
        row.expiresAt = expiresAt;
      }
      await db.from("dv_share_links").update(toDb(row)).eq("order_code", row.orderCode);
      return toPublic(row);
    }
    const { data: used } = await db.from("dv_share_links").select("slug, expires_at").gt("expires_at", now.toISOString());
    const slug = freshSlug(hint, new Set((used || []).map((row) => String(row.slug))));
    const row: ShareRow = {
      slug,
      orderCode: input.order.code,
      kind: input.order.kind,
      template: input.order.template,
      locale,
      email: input.order.customer.email,
      payload,
      status: live ? "live" : "reserved",
      createdAt: now.toISOString(),
      liveAt: live ? now.toISOString() : null,
      expiresAt,
    };
    const { error } = await db.from("dv_share_links").insert(toDb(row));
    if (error) {
      console.error(error.message);
      return null;
    }
    return toPublic(row);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function publishShare(order: OrderRecord): Promise<SharePublic | null> {
  try {
    const now = new Date().toISOString();
    const expiresAt = addMonths(now, shareMonths(order.kind));
    const db = admin();
    if (!db) {
      const rows = await readLocal();
      const row = rows.find((item) => item.orderCode === order.code);
      if (!row) return null;
      if (row.status !== "live") {
        row.status = "live";
        row.liveAt = now;
        row.expiresAt = expiresAt;
        await writeLocal(rows);
      }
      return toPublic(row);
    }
    const { data } = await db.from("dv_share_links").select("*").eq("order_code", order.code).maybeSingle();
    if (!data) return null;
    const row = fromDb(data as Record<string, unknown>);
    if (row.status !== "live") {
      row.status = "live";
      row.liveAt = now;
      row.expiresAt = expiresAt;
      await db.from("dv_share_links").update({ status: "live", live_at: now, expires_at: expiresAt }).eq("order_code", order.code);
    }
    return toPublic(row);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function releaseShare(orderCode: string) {
  try {
    const db = admin();
    if (!db) {
      const rows = await readLocal();
      await writeLocal(rows.filter((row) => row.orderCode !== orderCode || row.status === "live"));
      return;
    }
    await db.from("dv_share_links").delete().eq("order_code", orderCode).eq("status", "reserved");
  } catch (error) {
    console.error(error);
  }
}

export async function shareForOrder(orderCode: string): Promise<SharePublic | null> {
  try {
    const db = admin();
    if (!db) {
      const rows = await readLocal();
      const row = rows.find((item) => item.orderCode === orderCode);
      return row ? toPublic(row) : null;
    }
    const { data } = await db.from("dv_share_links").select("*").eq("order_code", orderCode).maybeSingle();
    return data ? toPublic(fromDb(data as Record<string, unknown>)) : null;
  } catch {
    return null;
  }
}

export async function sharePage(slug: string): Promise<
  | { state: "live"; row: ShareRow }
  | { state: "pending"; locale: "tr" | "en" }
  | { state: "expired"; locale: "tr" | "en" }
  | { state: "missing" }
> {
  const clean = slugifyShare(slug);
  if (!clean) return { state: "missing" };
  try {
    const db = admin();
    let row: ShareRow | undefined;
    if (db) {
      const { data } = await db.from("dv_share_links").select("*").eq("slug", clean).maybeSingle();
      row = data ? fromDb(data as Record<string, unknown>) : undefined;
    } else {
      row = (await readLocal()).find((item) => item.slug === clean);
    }
    if (!row?.slug) return { state: "missing" };
    const view = toPublic(row);
    if (view.status === "live") return { state: "live", row };
    if (view.status === "reserved") return { state: "pending", locale: row.locale };
    return { state: "expired", locale: row.locale };
  } catch {
    return { state: "missing" };
  }
}
