import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sharePage } from "@/lib/shareLink";
import { slugifyShare } from "@/lib/shareSlug";
import { supabaseUrl } from "@/lib/supabase/env";

const MAX_PER_ORDER = 2000;

export type ShareRsvp = {
  id: string;
  name: string;
  attending: boolean;
  count: number;
  children: number;
  meal: string;
  transfer: string;
  note: string;
  createdAt: string;
  orderCode?: string;
  title?: string;
  slug?: string;
};

export type RsvpInput = {
  name: string;
  attending: boolean;
  count?: number;
  children?: number;
  meal?: string;
  transfer?: string;
  note?: string;
};

function admin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function clean(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function clampInt(value: unknown, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function listShareRsvps(slug: string): Promise<ShareRsvp[] | null> {
  const db = admin();
  const cleanSlug = slugifyShare(slug);
  if (!db || !cleanSlug) return null;
  const found = await sharePage(cleanSlug);
  if (found.state !== "live") return null;
  const { data, error } = await db
    .from("dv_rsvp")
    .select("id,guest_name,attending,guest_count,children_count,meal,transfer,note,created_at")
    .eq("slug", found.row.slug)
    .order("created_at", { ascending: false })
    .limit(MAX_PER_ORDER);
  if (error || !data) return null;
  return data.map((row) => ({
    id: String(row.id),
    name: String(row.guest_name || ""),
    attending: Boolean(row.attending),
    count: Number(row.guest_count) || 0,
    children: Number(row.children_count) || 0,
    meal: String(row.meal || ""),
    transfer: String(row.transfer || ""),
    note: String(row.note || ""),
    createdAt: String(row.created_at || ""),
  }));
}

export async function saveShareRsvp(
  slug: string,
  input: RsvpInput,
): Promise<{ ok: true; rsvp: ShareRsvp } | { ok: false; status: number; error: string }> {
  const db = admin();
  if (!db) return { ok: false, status: 503, error: "Katılım formu şu an kullanılamıyor." };
  const found = await sharePage(slug);
  if (found.state !== "live") return { ok: false, status: 404, error: "Bu sayfa katılım kabul etmiyor." };

  const name = clean(input.name || "", 80);
  if (name.length < 2) return { ok: false, status: 400, error: "Lütfen adınızı yazın." };
  const attending = Boolean(input.attending);
  const count = attending ? clampInt(input.count ?? 1, 1, 20) : 0;
  const children = 0;
  const meal = "";
  const transfer = "";
  const note = "";

  const { data: order, error: orderError } = await db
    .from("dv_orders")
    .select("code,user_id")
    .eq("code", found.row.orderCode)
    .maybeSingle();
  if (orderError || !order?.code) return { ok: false, status: 404, error: "Sipariş bulunamadı." };

  const { count: total, error: countError } = await db
    .from("dv_rsvp")
    .select("id", { count: "exact", head: true })
    .eq("order_code", order.code);
  if (countError) return { ok: false, status: 500, error: "Katılım yanıtları okunamadı." };
  if ((total ?? 0) >= MAX_PER_ORDER) return { ok: false, status: 409, error: "Katılım listesi doldu." };

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const { error: insertError } = await db.from("dv_rsvp").insert({
    id,
    order_code: order.code,
    user_id: order.user_id || null,
    slug: found.row.slug,
    guest_name: name,
    attending,
    guest_count: count,
    children_count: children,
    meal,
    transfer,
    note,
    created_at: createdAt,
  });
  if (insertError) return { ok: false, status: 500, error: "Yanıt kaydedilemedi." };
  return {
    ok: true,
    rsvp: { id, name, attending, count, children, meal, transfer, note, createdAt },
  };
}

async function ownedCodes(userId: string, email: string) {
  const db = admin();
  if (!db) return new Map<string, string>();
  const titles = new Map<string, string>();
  const { data: byUser } = await db.from("dv_orders").select("code,title").eq("user_id", userId).limit(200);
  for (const row of byUser || []) titles.set(String(row.code), String(row.title || row.code));
  const mail = email.trim();
  if (mail && /^[^\s%_,\\]{3,160}$/.test(mail)) {
    const { data: byMail } = await db.from("dv_orders").select("code,title,customer_email").ilike("customer_email", mail).limit(200);
    for (const row of byMail || []) {
      if (String(row.customer_email || "").toLowerCase() !== mail.toLowerCase()) continue;
      titles.set(String(row.code), String(row.title || row.code));
    }
  }
  return titles;
}

export async function listUserRsvps(userId: string, email: string): Promise<ShareRsvp[] | null> {
  const db = admin();
  if (!db || !userId) return null;
  const titles = await ownedCodes(userId, email);
  const codes = [...titles.keys()];
  if (!codes.length) return [];
  const { data, error } = await db
    .from("dv_rsvp")
    .select("id,order_code,slug,guest_name,attending,guest_count,children_count,meal,transfer,note,created_at")
    .in("order_code", codes)
    .order("created_at", { ascending: false })
    .limit(MAX_PER_ORDER);
  if (error || !data) return null;
  return data.map((row) => {
    const orderCode = String(row.order_code || "");
    return {
      id: String(row.id),
      name: String(row.guest_name || ""),
      attending: Boolean(row.attending),
      count: Number(row.guest_count) || 0,
      children: Number(row.children_count) || 0,
      meal: String(row.meal || ""),
      transfer: String(row.transfer || ""),
      note: String(row.note || ""),
      createdAt: String(row.created_at || ""),
      orderCode,
      title: titles.get(orderCode) || orderCode,
      slug: String(row.slug || ""),
    };
  });
}
