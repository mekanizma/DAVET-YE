import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sharePage } from "@/lib/shareLink";
import { slugifyShare } from "@/lib/shareSlug";
import { supabaseUrl } from "@/lib/supabase/env";

const MAX_PER_ORDER = 500;
const NAME_MAX = 80;
const BODY_MAX = 300;

export type ShareWish = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
};

function admin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function cleanName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, NAME_MAX);
}

function cleanBody(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, BODY_MAX);
}

export async function listShareWishes(slug: string): Promise<ShareWish[] | null> {
  const db = admin();
  const clean = slugifyShare(slug);
  if (!db || !clean) return null;
  const found = await sharePage(clean);
  if (found.state !== "live") return null;
  const { data, error } = await db
    .from("dv_wishes")
    .select("id,guest_name,body,created_at")
    .eq("slug", found.row.slug)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_ORDER);
  if (error || !data) return null;
  return data.map((row) => ({
    id: String(row.id),
    name: String(row.guest_name || ""),
    text: String(row.body || ""),
    createdAt: String(row.created_at || ""),
  }));
}

export async function saveShareWish(
  slug: string,
  name: string,
  text: string,
): Promise<{ ok: true; wish: ShareWish } | { ok: false; status: number; error: string }> {
  const db = admin();
  if (!db) return { ok: false, status: 503, error: "Dilekler şu an kullanılamıyor." };
  const found = await sharePage(slug);
  if (found.state !== "live") return { ok: false, status: 404, error: "Bu sayfa dilek kabul etmiyor." };

  const guestName = cleanName(name);
  const body = cleanBody(text);
  if (guestName.length < 2) return { ok: false, status: 400, error: "Lütfen adınızı yazın." };
  if (body.length < 3) return { ok: false, status: 400, error: "Dileğiniz en az 3 karakter olmalıdır." };

  const { data: order, error: orderError } = await db
    .from("dv_orders")
    .select("code,user_id")
    .eq("code", found.row.orderCode)
    .maybeSingle();
  if (orderError || !order?.code) return { ok: false, status: 404, error: "Sipariş bulunamadı." };

  const { count, error: countError } = await db
    .from("dv_wishes")
    .select("id", { count: "exact", head: true })
    .eq("order_code", order.code);
  if (countError) return { ok: false, status: 500, error: "Dilekler okunamadı." };
  if ((count ?? 0) >= MAX_PER_ORDER) return { ok: false, status: 409, error: "Dilek defteri doldu." };

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const { error: insertError } = await db.from("dv_wishes").insert({
    id,
    order_code: order.code,
    user_id: order.user_id || null,
    slug: found.row.slug,
    guest_name: guestName,
    body,
    created_at: createdAt,
  });
  if (insertError) return { ok: false, status: 500, error: "Dilek kaydedilemedi." };
  return { ok: true, wish: { id, name: guestName, text: body, createdAt } };
}
