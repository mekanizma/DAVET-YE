import { NextResponse } from "next/server";
import { listUserPrintCards } from "@/lib/userCards";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Kartlar kullanılamıyor." }, { status: 503 });
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user?.email) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const cards = await listUserPrintCards(user.id, user.email);
  if (!cards) return NextResponse.json({ error: "Kartlar okunamadı." }, { status: 500 });
  return NextResponse.json({ cards }, { headers: { "Cache-Control": "no-store" } });
}
