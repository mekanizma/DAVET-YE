import { NextResponse } from "next/server";
import { toOrder, type DbOrder } from "@/lib/orderRow";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseRoute, createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Supabase ayarları eksik." }, { status: 503 });
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const { data, error } = await supabase.from("dv_orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Siparişler okunamadı." }, { status: 500 });
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  return NextResponse.json({
    email: user.email,
    name,
    orders: ((data || []) as DbOrder[]).map(toOrder),
  });
}

export async function DELETE() {
  if (!supabaseConfigured()) return NextResponse.json({ ok: true });
  const { supabase, seal } = await createSupabaseRoute();
  await supabase.auth.signOut();
  return seal(NextResponse.json({ ok: true }));
}
