"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isLocale, localeFromPath, LOCALE_COOKIE, lp, type Locale } from "./locale";

const LocaleContext = createContext<Locale>("tr");

function cookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=(tr|en)(?:;|$)`));
  return match && isLocale(match[1]) ? match[1] : null;
}

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname();
  const fromPath = localeFromPath(pathname);
  const [remembered, setRemembered] = useState<Locale | null>(null);
  // Prefixed pages follow the URL immediately. Unprefixed routes (the account)
  // follow the cookie after a language switch, then the value from the server.
  const value = fromPath ?? remembered ?? locale;

  useEffect(() => {
    setRemembered(cookieLocale());
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = value === "en" ? "en" : "tr";
  }, [value]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useLp() {
  const locale = useLocale();
  return (path?: string) => lp(locale, path);
}
