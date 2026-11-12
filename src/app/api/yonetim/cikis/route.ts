import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/adminToken";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseRoute } from "@/lib/supabase/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  if (!supabaseConfigured()) return res;
  const { supabase, seal } = await createSupabaseRoute();
  await supabase.auth.signOut();
  return seal(res);
}
