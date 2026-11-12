import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/adminToken";
import { authErrorMessage } from "@/lib/supabase/errors";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseRoute } from "@/lib/supabase/server";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 15 * 60 * 1000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 8;
}

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase ayarları eksik. .env.local içine proje adresi ve anon anahtarını yazıp sunucuyu yeniden başlatın." },
      { status: 503 },
    );
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return NextResponse.json({ error: "Çok fazla deneme. Bir süre sonra yeniden deneyin." }, { status: 429 });
  }
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
  }

  const { supabase, seal } = await createSupabaseRoute();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return seal(NextResponse.json({ error: authErrorMessage(error?.message || "invalid login") }, { status: 401 }));
  }
  const { data: profile } = await supabase.from("dv_profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return seal(NextResponse.json({ error: "Bu hesap yönetici değil." }, { status: 403 }));
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return seal(res);
}
