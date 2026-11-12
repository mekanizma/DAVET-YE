"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Logo from "./Logo";
import { NAV_LINKS } from "@/data/site";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export type HeaderAccount = { name: string } | null;

function accountName(user: { user_metadata?: { full_name?: unknown } }) {
  const raw = user.user_metadata?.full_name;
  return typeof raw === "string" ? raw.trim() : "";
}

function accountLabel(account: HeaderAccount) {
  if (!account) return "Giriş yap";
  return account.name.split(/\s+/).filter(Boolean)[0] || "Hesabım";
}

export default function SiteHeader({ account }: { account: HeaderAccount }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<HeaderAccount>(account);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const signedIn = Boolean(user);
  const loginLabel = accountLabel(user);
  const loginHref = signedIn ? "/panel" : "/panel/giris?arayuz=tr";

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <div className="site-header__bar wrap wrap--lg">
        <Logo priority width={132} className="site-header__logo" />

        <nav className="site-nav" aria-label="Ana menü">
          {NAV_LINKS.map((l) => (
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
              aria-haspopup="true"
              aria-expanded={langOpen}
              aria-label="Dil seçin"
              onClick={() => setLangOpen((v) => !v)}
            >
              <span className="lang__flag" aria-hidden="true">
                🇹🇷
              </span>
              <span className="lang__code">TR</span>
              <Icon name="chevron-down" size={14} />
            </button>
            {langOpen && (
              <ul className="lang__menu" role="menu">
                <li role="none">
                  <button role="menuitem" className="lang__item is-active" onClick={() => setLangOpen(false)}>
                    Türkçe <Icon name="check" size={14} />
                  </button>
                </li>
                <li role="none">
                  <button role="menuitem" className="lang__item" disabled aria-disabled="true">
                    English <small>yakında</small>
                  </button>
                </li>
              </ul>
            )}
          </div>
          <Link
            href={loginHref}
            className="btn btn--ghost btn--sm site-header__login"
            aria-label={signedIn ? (user?.name ? `Hesabım, ${user.name}` : "Hesabım") : "Giriş yap"}
          >
            {signedIn ? <Icon name="user" size={15} /> : null}
            <span>{loginLabel}</span>
          </Link>
          <Link href="/tr/davetiye-olustur" className="btn btn--dark btn--sm site-header__cta">
            Davetiye Oluştur <Icon name="arrow" size={14} />
          </Link>
          <button
            ref={menuBtn}
            type="button"
            className="menu-btn"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
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
          aria-label="Menü"
        >
          <nav aria-label="Mobil menü" className="drawer__nav">
            {NAV_LINKS.map((l) => (
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
            <Link href="/tr/davetiye-olustur" className="btn btn--dark btn--block">
              Davetiye Oluştur <Icon name="arrow" size={16} />
            </Link>
            <Link href={loginHref} className="btn btn--ghost btn--block">
              {signedIn ? <Icon name="user" size={16} /> : null}
              <span>{signedIn ? (user?.name || "Hesabım") : "Giriş yap"}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
