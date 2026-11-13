import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, localeFromPath, type Locale } from "@/i18n/locale";
import { isDesignStart, safeReturnPath } from "@/lib/returnTo";
import { supabaseConfigured } from "@/lib/supabase/env";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  return to;
}

function localeHeaders(req: NextRequest) {
  const fromPath = localeFromPath(req.nextUrl.pathname);
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale = fromPath ?? (cookie === "en" ? "en" : "tr");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);
  return { locale, fromPath, requestHeaders };
}

function rememberLocale(res: NextResponse, locale: Locale, fromPath: Locale | null) {
  if (!fromPath) return res;
  res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { locale, fromPath, requestHeaders } = localeHeaders(req);
  const pass = () => rememberLocale(NextResponse.next({ request: { headers: requestHeaders } }), locale, fromPath);
  const adminPage = pathname === "/yonetim" || pathname.startsWith("/yonetim/");
  const adminApi = pathname.startsWith("/api/yonetim");
  const panel = pathname === "/panel" || pathname.startsWith("/panel/");
  const design = isDesignStart(pathname);
  if (!adminPage && !adminApi && !panel && !design) return pass();

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
  const openAdmin = pathname === "/yonetim/giris" || pathname === "/api/yonetim/giris" || pathname === "/api/yonetim/cikis";
  const openPanel =
    pathname === "/panel/giris" ||
    pathname === "/panel/kayit" ||
    pathname === "/panel/sifremi-unuttum" ||
    pathname === "/panel/sifre-yenile";

  if (!supabaseConfigured()) {
    if (openAdmin || openPanel) return rememberLocale(supabaseResponse, locale, fromPath);
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
        supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
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
      return rememberLocale(supabaseResponse, locale, fromPath);
    }
    if (admin) return rememberLocale(supabaseResponse, locale, fromPath);
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
    return rememberLocale(supabaseResponse, locale, fromPath);
  }

  if (user) return rememberLocale(supabaseResponse, locale, fromPath);
  const url = req.nextUrl.clone();
  url.pathname = "/panel/giris";
  url.search = "";
  url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
  return copyCookies(supabaseResponse, NextResponse.redirect(url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon-|apple-touch|img/|fonts/|media/|api/).*)",
    "/api/yonetim/:path*",
    "/api/siparis",
    "/api/siparis/:path*",
    "/api/hesap",
  ],
};
