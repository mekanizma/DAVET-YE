import { NextResponse } from "next/server";
import { loadPanelAccount } from "@/lib/panelAccount";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseRoute } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Supabase ayarları eksik." }, { status: 503 });
  const account = await loadPanelAccount();
  if (!account) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  return NextResponse.json(account, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  if (!supabaseConfigured()) return NextResponse.json({ ok: true });
  const { supabase, seal } = await createSupabaseRoute();
  await supabase.auth.signOut();
  return seal(NextResponse.json({ ok: true }));
}
