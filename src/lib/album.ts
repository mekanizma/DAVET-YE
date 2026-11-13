import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sharePage } from "@/lib/shareLink";
import { slugifyShare } from "@/lib/shareSlug";
import { supabaseUrl } from "@/lib/supabase/env";

const BUCKET = "album";
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PER_ORDER = 200;

const KINDS = {
  jpg: { mime: "image/jpeg", magic: (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  png: { mime: "image/png", magic: (b: Uint8Array) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  webp: {
    mime: "image/webp",
    magic: (b: Uint8Array) =>
      b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
} as const;

export type AlbumExt = keyof typeof KINDS;
export type AlbumSource = "wall" | "lens";

export type AlbumItem = {
  id: string;
  orderCode: string;
  title: string;
  source: AlbumSource;
  createdAt: string;
  bytes: number;
  ext: AlbumExt;
  url?: string;
};

type PhotoRow = {
  id: string;
  order_code: string;
  user_id: string | null;
  slug: string;
  source: string;
  ext: string;
  bytes: number;
  created_at: string;
};

function admin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function sniffAlbum(bytes: Uint8Array): AlbumExt | null {
  if (bytes.byteLength < 8 || bytes.byteLength > MAX_BYTES) return null;
  for (const [ext, kind] of Object.entries(KINDS) as [AlbumExt, (typeof KINDS)[AlbumExt]][]) {
    if (kind.magic(bytes)) return ext;
  }
  return null;
}

export function albumMime(ext: AlbumExt) {
  return KINDS[ext].mime;
}

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function asExt(value: string): AlbumExt | null {
  return value === "jpg" || value === "png" || value === "webp" ? value : null;
}

function asSource(value: string): AlbumSource | null {
  return value === "wall" || value === "lens" ? value : null;
}

export async function saveSharePhoto(
  slug: string,
  source: AlbumSource,
  bytes: Uint8Array,
): Promise<{ ok: true; id: string } | { ok: false; status: number; error: string }> {
  const db = admin();
  if (!db) return { ok: false, status: 503, error: "Albüm şu an kullanılamıyor." };
  const found = await sharePage(slug);
  if (found.state !== "live") return { ok: false, status: 404, error: "Bu sayfa fotoğraf kabul etmiyor." };
  const ext = sniffAlbum(bytes);
  if (!ext) return { ok: false, status: 400, error: "Fotoğraf JPG, PNG veya WEBP olmalı ve 8 MB’ı geçmemeli." };

  const { data: order, error: orderError } = await db
    .from("dv_orders")
    .select("code,user_id")
    .eq("code", found.row.orderCode)
    .maybeSingle();
  if (orderError || !order?.code) return { ok: false, status: 404, error: "Sipariş bulunamadı." };

  const { count, error: countError } = await db
    .from("dv_album_photos")
    .select("id", { count: "exact", head: true })
    .eq("order_code", order.code);
  if (countError) return { ok: false, status: 500, error: "Albüm okunamadı." };
  if ((count ?? 0) >= MAX_PER_ORDER) return { ok: false, status: 409, error: "Bu albüm doldu." };

  const id = crypto.randomUUID();
  const path = `${order.code}/${id}.${ext}`;
  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: KINDS[ext].mime,
    upsert: false,
  });
  if (uploadError) return { ok: false, status: 500, error: "Fotoğraf kaydedilemedi." };

  const { error: insertError } = await db.from("dv_album_photos").insert({
    id,
    order_code: order.code,
    user_id: order.user_id || null,
    slug: found.row.slug,
    source,
    ext,
    bytes: bytes.byteLength,
  });
  if (insertError) {
    await db.storage.from(BUCKET).remove([path]);
    return { ok: false, status: 500, error: "Fotoğraf kaydedilemedi." };
  }
  return { ok: true, id };
}

export async function listSharePhotos(slug: string): Promise<AlbumItem[] | null> {
  const db = admin();
  const clean = slugifyShare(slug);
  if (!db || !clean) return null;
  const found = await sharePage(clean);
  if (found.state !== "live") return null;
  const { data, error } = await db
    .from("dv_album_photos")
    .select("id,order_code,source,ext,bytes,created_at,slug")
    .eq("slug", found.row.slug)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_ORDER);
  if (error || !data) return null;
  return data.flatMap((row) => {
    const source = asSource(String(row.source));
    const ext = asExt(String(row.ext));
    if (!source || !ext) return [];
    return [{
      id: String(row.id),
      orderCode: String(row.order_code),
      title: "",
      source,
      createdAt: String(row.created_at),
      bytes: Number(row.bytes) || 0,
      ext,
    }];
  });
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

export async function listUserAlbum(userId: string, email: string): Promise<AlbumItem[] | null> {
  const db = admin();
  if (!db || !userId) return null;
  const titles = await ownedCodes(userId, email);
  const codes = [...titles.keys()];
  if (!codes.length) return [];
  const { data, error } = await db
    .from("dv_album_photos")
    .select("id,order_code,source,ext,bytes,created_at")
    .in("order_code", codes)
    .order("created_at", { ascending: false })
    .limit(MAX_PER_ORDER);
  if (error || !data) return null;
  const items = data.flatMap((row) => {
    const source = asSource(String(row.source));
    const ext = asExt(String(row.ext));
    const orderCode = String(row.order_code);
    if (!source || !ext || !titles.has(orderCode)) return [];
    return [{
      id: String(row.id),
      orderCode,
      title: titles.get(orderCode) || orderCode,
      source,
      createdAt: String(row.created_at),
      bytes: Number(row.bytes) || 0,
      ext,
    }];
  });
  const paths = items.map((item) => `${item.orderCode}/${item.id}.${item.ext}`);
  if (!paths.length) return items;
  const signed = await db.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
  return items.map((item, index) => ({ ...item, url: signed.data?.[index]?.signedUrl || "" }));
}

async function photoRow(id: string): Promise<PhotoRow | null> {
  const db = admin();
  if (!db || !isUuid(id)) return null;
  const { data, error } = await db.from("dv_album_photos").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as PhotoRow;
}

export async function readSharePhoto(slug: string, id: string): Promise<{ bytes: Uint8Array; ext: AlbumExt } | null> {
  const db = admin();
  const row = await photoRow(id);
  const clean = slugifyShare(slug);
  if (!db || !row || !clean || row.slug !== clean) return null;
  const found = await sharePage(clean);
  if (found.state !== "live" || found.row.slug !== row.slug) return null;
  const ext = asExt(row.ext);
  if (!ext) return null;
  const { data, error } = await db.storage.from(BUCKET).download(`${row.order_code}/${row.id}.${ext}`);
  if (error || !data) return null;
  return { bytes: new Uint8Array(await data.arrayBuffer()), ext };
}

async function userOwns(userId: string, email: string, orderCode: string) {
  const titles = await ownedCodes(userId, email);
  return titles.has(orderCode);
}

export async function readUserPhoto(userId: string, email: string, id: string): Promise<{ bytes: Uint8Array; ext: AlbumExt } | null> {
  const db = admin();
  const row = await photoRow(id);
  if (!db || !row || !userId) return null;
  if (!(await userOwns(userId, email, row.order_code))) return null;
  const ext = asExt(row.ext);
  if (!ext) return null;
  const { data, error } = await db.storage.from(BUCKET).download(`${row.order_code}/${row.id}.${ext}`);
  if (error || !data) return null;
  return { bytes: new Uint8Array(await data.arrayBuffer()), ext };
}

export async function deleteUserPhoto(userId: string, email: string, id: string): Promise<boolean> {
  const db = admin();
  const row = await photoRow(id);
  if (!db || !row || !userId) return false;
  if (!(await userOwns(userId, email, row.order_code))) return false;
  const ext = asExt(row.ext);
  if (ext) await db.storage.from(BUCKET).remove([`${row.order_code}/${row.id}.${ext}`]);
  const { error } = await db.from("dv_album_photos").delete().eq("id", row.id);
  return !error;
}
