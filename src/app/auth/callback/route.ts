import { NextResponse } from "next/server";
import { safeReturnPath } from "@/lib/returnTo";
import { createSupabaseRoute } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const safe = safeReturnPath(url.searchParams.get("next"));
  if (code) {
    const { supabase, seal } = await createSupabaseRoute();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return seal(NextResponse.redirect(new URL(safe, url.origin)));
  }
  return NextResponse.redirect(new URL("/panel/giris?hata=dogrulama", url.origin));
}
