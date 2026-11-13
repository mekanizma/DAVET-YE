export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "dv_locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "tr" || value === "en";
}

export function htmlLang(locale: Locale): "tr" | "en" {
  return locale === "en" ? "en" : "tr";
}

/** Path under a locale. `path` keeps the existing slug, e.g. "/fiyatlar". */
export function lp(locale: Locale, path = "/"): string {
  if (!path || path === "/") return `/${locale}`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

export function localeFromPath(pathname: string): Locale | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/tr" || pathname.startsWith("/tr/")) return "tr";
  return null;
}

/** Swap /tr and /en on the current path. Other paths stay put. */
export function swapLocale(pathname: string, next: Locale): string {
  if (localeFromPath(pathname)) return pathname.replace(/^\/(tr|en)/, `/${next}`);
  return pathname;
}

/** Invitation and newspaper previews live outside /en, so the query selects the English artwork. */
export function withLocaleQuery(locale: Locale, href: string): string {
  if (locale !== "en" || /(?:^|[?&])dil=/.test(href)) return href;
  return `${href}${href.includes("?") ? "&" : "?"}dil=en`;
}

