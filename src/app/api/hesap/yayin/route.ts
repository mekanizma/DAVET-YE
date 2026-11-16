import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toOrder, type DbOrder } from "@/lib/orderRow";
import type { OrderRecord } from "@/lib/orderTypes";
import { shareDesignForOrder, updateShareDesign } from "@/lib/shareLink";
import { supabaseConfigured, supabaseUrl } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

function adminDb() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function ownedApprovedOrder(code: string, userId: string, email: string): Promise<OrderRecord | null> {
  const db = adminDb();
  if (!db) return null;
  const { data, error } = await db.from("dv_orders").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  if (error || !data) return null;
  const row = data as DbOrder;
  const order = toOrder(row);
  const owns = row.user_id === userId || order.customer.email.toLowerCase() === email.toLowerCase();
  if (!owns || order.status !== "onaylandi") return null;
  return order;
}

export async function GET(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Hesap kullanılamıyor." }, { status: 503 });
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const code = new URL(req.url).searchParams.get("code") || "";
  if (!code.trim()) return NextResponse.json({ error: "Sipariş kodu gerekli." }, { status: 400 });

  const order = await ownedApprovedOrder(code, user.id, user.email);
  if (!order) return NextResponse.json({ error: "Onaylı sipariş bulunamadı." }, { status: 404 });

  const packed = await shareDesignForOrder(order.code);
  if (!packed) return NextResponse.json({ error: "Yayın kaydı bulunamadı." }, { status: 404 });

  return NextResponse.json(
    {
      order,
      share: packed.share,
      design: packed.design,
      kind: packed.kind,
      template: packed.template,
      locale: packed.locale,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Hesap kullanılamıyor." }, { status: 503 });
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  let body: { code?: string; design?: unknown; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const code = String(body.code || "").trim();
  if (!code) return NextResponse.json({ error: "Sipariş kodu gerekli." }, { status: 400 });

  const order = await ownedApprovedOrder(code, user.id, user.email);
  if (!order) return NextResponse.json({ error: "Onaylı sipariş bulunamadı." }, { status: 404 });

  const share = await updateShareDesign({
    order,
    design: body.design,
    locale: body.locale === "en" ? "en" : "tr",
  });
  if (!share) return NextResponse.json({ error: "Yeniden yayınlanamadı." }, { status: 500 });

  return NextResponse.json({ share, order }, { headers: { "Cache-Control": "no-store" } });
}
