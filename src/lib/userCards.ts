import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/seo";
import { supabaseUrl } from "@/lib/supabase/env";
import { toOrder, type DbOrder } from "@/lib/orderRow";

export type UserPrintCard = {
  code: string;
  title: string;
  status: string;
  ready: boolean;
  bride: string;
  groom: string;
  date: string;
  time: string;
  venue: string;
  place: string;
  qr: boolean;
  qrDesign: string;
  card: boolean;
  cardDesign: string;
  shareUrl: string;
};

function admin() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function namesFrom(info: Record<string, unknown>, snapshot: Record<string, string>) {
  let bride = text(info.partnerA);
  let groom = text(info.partnerB);
  if (!bride && !groom) {
    const joined = snapshot["İsimler"] || snapshot.Names || "";
    const parts = joined.split(/\s+&\s+/);
    bride = (parts[0] || "").trim();
    groom = (parts[1] || "").trim();
  }
  return { bride, groom };
}

export async function listUserPrintCards(userId: string, email: string): Promise<UserPrintCard[] | null> {
  const db = admin();
  if (!db || !userId) return null;
  const mail = email.trim();
  const { data: byUser } = await db.from("dv_orders").select("*").eq("user_id", userId).eq("kind", "davetiye").order("created_at", { ascending: false }).limit(40);
  let byMail: DbOrder[] = [];
  if (mail && /^[^\s%_,\\]{3,160}$/.test(mail)) {
    const found = await db.from("dv_orders").select("*").eq("kind", "davetiye").ilike("customer_email", mail).order("created_at", { ascending: false }).limit(40);
    byMail = ((found.data || []) as DbOrder[]).filter((row) => String(row.customer_email || "").toLowerCase() === mail.toLowerCase());
  }
  const orders = new Map<string, ReturnType<typeof toOrder>>();
  for (const row of [...((byUser || []) as DbOrder[]), ...byMail]) {
    const order = toOrder(row);
    orders.set(order.code, order);
  }
  const codes = [...orders.keys()];
  if (!codes.length) return [];
  const { data: shares, error } = await db.from("dv_share_links").select("order_code,slug,payload").in("order_code", codes);
  if (error) return null;
  const shareByCode = new Map<string, { slug: string; payload: Record<string, unknown> }>();
  for (const row of shares || []) {
    const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload as Record<string, unknown> : {};
    shareByCode.set(String(row.order_code), { slug: String(row.slug || ""), payload });
  }
  const cards: UserPrintCard[] = [];
  for (const order of orders.values()) {
    const share = shareByCode.get(order.code);
    const payload = share?.payload || {};
    const info = payload.info && typeof payload.info === "object" ? payload.info as Record<string, unknown> : {};
    const print = payload.print && typeof payload.print === "object" ? payload.print as Record<string, unknown> : null;
    const who = namesFrom(info, order.snapshot);
    const named = Boolean(who.bride || who.groom);
    const qr = order.lines.some((line) => line.id === "masa-qr") || print?.qr === true;
    const card = print ? print.card === true : named;
    if (!qr && !card) continue;
    cards.push({
      code: order.code,
      title: order.title,
      status: order.status,
      ready: order.status === "onaylandi",
      bride: who.bride,
      groom: who.groom,
      date: text(info.date),
      time: text(info.time),
      venue: text(info.venue),
      place: text(info.address) || text(info.place),
      qr,
      qrDesign: text(print?.qrDesign) || "minimal",
      card,
      cardDesign: text(print?.cardDesign) || "altin",
      shareUrl: share?.slug ? `${siteUrl()}/d/${share.slug}` : "",
    });
  }
  return cards;
}
