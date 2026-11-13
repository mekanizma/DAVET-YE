"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Logo from "./Logo";
import { LOCALE_COOKIE, localeFromPath, swapLocale, type Locale } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { useLocale, useLp } from "@/i18n/provider";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export type HeaderAccount = { name: string } | null;

const LANGUAGES: { code: Locale; label: string; flag: string; short: string }[] = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷", short: "TR" },
  { code: "en", label: "English", flag: "🇬🇧", short: "EN" },
];

function accountName(user: { user_metadata?: { full_name?: unknown } }) {
  const raw = user.user_metadata?.full_name;
  return typeof raw === "string" ? raw.trim() : "";
}

function accountLabel(account: HeaderAccount, locale: Locale) {
  const fallback = locale === "en" ? "Account" : "Hesabım";
  if (!account) return locale === "en" ? "Sign in" : "Giriş yap";
  return account.name.split(/\s+/).filter(Boolean)[0] || fallback;
}

export default function SiteHeader({ account }: { account: HeaderAccount }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const lp = useLp();
  const copy = marketing(locale);
  const en = locale === "en";
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<HeaderAccount>(account);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const currentLang = LANGUAGES.find((item) => item.code === locale) ?? LANGUAGES[0];

  // close menus on navigation
  useEffect(() => {
    setOpen(false);
    setLangOpen(false);
  }, [pathname]);

  useEffect(() => {
    setUser(account);
  }, [account]);

  useEffect(() => {
    let live = true;
    let unsubscribe = () => {};
    try {
      const supabase = createSupabaseBrowser();
      const apply = (next: HeaderAccount) => {
        if (live) setUser(next);
      };
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) apply({ name: accountName(data.user) });
      }).catch(() => undefined);
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") apply(null);
        else if (session?.user) apply({ name: accountName(session.user) });
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      /* Supabase ayarı yoksa giriş bağlantısı kalır. */
    }
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // drawer: lock scroll, Esc to close, basic focus handling
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = drawerRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
      if (e.key === "Tab" && drawerRef.current) {
        const f = drawerRef.current.querySelectorAll<HTMLElement>("a,button");
        if (!f.length) return;
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    setLangOpen(false);
    setOpen(false);
    if (next === locale) return;
    if (localeFromPath(pathname)) {
      const search = typeof window === "undefined" ? "" : window.location.search;
      router.push(`${swapLocale(pathname, next)}${search}`);
    } else {
      router.refresh();
    }
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const signedIn = Boolean(user);
  const loginLabel = accountLabel(user, locale);
  const loginHref = signedIn ? "/panel" : "/panel/giris";
  const accountFallback = en ? "Account" : "Hesabım";
  const signIn = en ? "Sign in" : "Giriş yap";
  const createLabel = en ? "Create an invitation" : "Davetiye Oluştur";
  const loginAria = signedIn ? (user?.name ? `${accountFallback}, ${user.name}` : accountFallback) : signIn;

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a className="skip-link" href="#main">
        {en ? "Skip to content" : "İçeriğe geç"}
      </a>
      <div className="site-header__bar wrap wrap--lg">
        <Logo priority width={132} className="site-header__logo" />

        <nav className="site-nav" aria-label={en ? "Main menu" : "Ana menü"}>
          {copy.nav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="site-nav__link"
              aria-current={isActive(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <div className="lang">
            <button
              type="button"
              className="lang__btn"
              style={{ minHeight: 44 }}
              aria-haspopup="true"
              aria-expanded={langOpen}
              aria-label={en ? "Choose language" : "Dil seçin"}
              onClick={() => setLangOpen((v) => !v)}
            >
              <span className="lang__flag" aria-hidden="true">
                {currentLang.flag}
              </span>
              <span className="lang__code">{currentLang.short}</span>
              <Icon name="chevron-down" size={14} />
            </button>
            {langOpen && (
              <ul className="lang__menu" role="menu">
                {LANGUAGES.map((item) => {
                  const current = item.code === locale;
                  return (
                    <li role="none" key={item.code}>
                      <button
                        type="button"
                        role="menuitem"
                        className={`lang__item${current ? " is-active" : ""}`}
                        style={{ minHeight: 44 }}
                        onClick={() => choose(item.code)}
                      >
                        <span>
                          <span className="lang__flag" aria-hidden="true">{item.flag}</span>{" "}
                          {item.label}
                        </span>
                        {current ? <Icon name="check" size={14} /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Link
            href={loginHref}
            className="btn btn--ghost btn--sm site-header__login"
            aria-label={loginAria}
          >
            {signedIn ? <Icon name="user" size={15} /> : null}
            <span>{loginLabel}</span>
          </Link>
          <Link href={lp("/davetiye-olustur")} className="btn btn--dark btn--sm site-header__cta">
            {createLabel} <Icon name="arrow" size={14} />
          </Link>
          <button
            ref={menuBtn}
            type="button"
            className="menu-btn"
            aria-label={open ? (en ? "Close menu" : "Menüyü kapat") : (en ? "Open menu" : "Menüyü aç")}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} size={26} />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-drawer"
          ref={drawerRef}
          className="drawer"
          role="dialog"
          aria-modal="true"
          aria-label={en ? "Menu" : "Menü"}
        >
          <nav aria-label={en ? "Mobile menu" : "Mobil menü"} className="drawer__nav">
            {copy.nav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="drawer__link"
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {l.label}
                <Icon name="chevron-right" size={18} />
              </Link>
            ))}
          </nav>
          <div className="drawer__actions">
            <div
              role="group"
              aria-label={en ? "Choose language" : "Dil seçin"}
              style={{ display: "flex", gap: 8, width: "100%" }}
            >
              {LANGUAGES.map((item) => {
                const current = item.code === locale;
                return (
                  <button
                    key={item.code}
                    type="button"
                    className={`btn ${current ? "btn--dark" : "btn--ghost"}`}
                    style={{ flex: "1 1 0", minHeight: 44, minWidth: 0, padding: "0 8px" }}
                    aria-pressed={current}
                    onClick={() => choose(item.code)}
                  >
                    <span aria-hidden="true">{item.flag}</span>
                    <span>{item.label}</span>
                    {current ? <Icon name="check" size={14} /> : null}
                  </button>
                );
              })}
            </div>
            <Link href={lp("/davetiye-olustur")} className="btn btn--dark btn--block">
              {createLabel} <Icon name="arrow" size={16} />
            </Link>
            <Link href={loginHref} className="btn btn--ghost btn--block">
              {signedIn ? <Icon name="user" size={16} /> : null}
              <span>{signedIn ? (user?.name || accountFallback) : signIn}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
