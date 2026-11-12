import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDesignStart, safeReturnPath } from "@/lib/returnTo";
import { supabaseConfigured } from "@/lib/supabase/env";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  return to;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminPage = pathname === "/yonetim" || pathname.startsWith("/yonetim/");
  const adminApi = pathname.startsWith("/api/yonetim");
  const panel = pathname === "/panel" || pathname.startsWith("/panel/");
  const design = isDesignStart(pathname);
  if (!adminPage && !adminApi && !panel && !design) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request: req });
  const openAdmin = pathname === "/yonetim/giris" || pathname === "/api/yonetim/giris" || pathname === "/api/yonetim/cikis";
  const openPanel =
    pathname === "/panel/giris" ||
    pathname === "/panel/kayit" ||
    pathname === "/panel/sifremi-unuttum" ||
    pathname === "/panel/sifre-yenile";

  if (!supabaseConfigured()) {
    if (openAdmin || openPanel) return supabaseResponse;
    if (adminApi) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = adminPage ? "/yonetim/giris" : "/panel/giris";
    url.search = "";
    if (!adminPage) url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  let admin = false;
  if (user) {
    const { data } = await supabase.from("dv_profiles").select("role").eq("id", user.id).maybeSingle();
    admin = data?.role === "admin";
  }

  if (adminPage || adminApi) {
    if (openAdmin) {
      if (admin && pathname === "/yonetim/giris") {
        const url = req.nextUrl.clone();
        url.pathname = "/yonetim";
        url.search = "";
        return copyCookies(supabaseResponse, NextResponse.redirect(url));
      }
      return supabaseResponse;
    }
    if (admin) return supabaseResponse;
    if (adminApi) return copyCookies(supabaseResponse, NextResponse.json({ error: "Giriş gerekli." }, { status: 401 }));
    const url = req.nextUrl.clone();
    url.pathname = "/yonetim/giris";
    url.searchParams.set("next", pathname);
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (openPanel) {
    if (user && (pathname === "/panel/giris" || pathname === "/panel/kayit")) {
      const dest = new URL(safeReturnPath(req.nextUrl.searchParams.get("next")), req.nextUrl.origin);
      return copyCookies(supabaseResponse, NextResponse.redirect(dest));
    }
    return supabaseResponse;
  }

  if (user) return supabaseResponse;
  const url = req.nextUrl.clone();
  url.pathname = "/panel/giris";
  url.search = "";
  url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
  return copyCookies(supabaseResponse, NextResponse.redirect(url));
}

export const config = {
  matcher: [
    "/yonetim",
    "/yonetim/:path*",
    "/api/yonetim/:path*",
    "/panel",
    "/panel/:path*",
    "/tr/davetiye-olustur",
    "/tr/davetiye-olustur/:path*",
    "/tr/gazete-tasarla",
    "/tr/gazete-tasarla/:path*",
    "/tr/gazete-olustur",
    "/tr/gazete-olustur/:path*",
  ],
};
