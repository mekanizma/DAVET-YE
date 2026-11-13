"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "../Icon";
import Logo from "../Logo";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import { AccountProvider, useAccount, type Account } from "./account";

const AUTH = new Set(["/panel/giris", "/panel/kayit", "/panel/sifremi-unuttum", "/panel/sifre-yenile"]);

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function links(locale: Locale): { href: string; label: string; icon: IconName; exact?: boolean }[] {
  return [
    { href: "/panel", label: tx(locale, "Özet", "Overview"), icon: "home", exact: true },
    { href: "/panel/tasarimlar", label: tx(locale, "Tasarımlarım", "My designs"), icon: "sparkle" },
    { href: "/panel/album", label: tx(locale, "Albüm", "Album"), icon: "image" },
    { href: "/panel/hesap", label: tx(locale, "Hesap", "Account"), icon: "user" },
  ];
}

function on(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "";
}

export default function PanelFrame({ children, initialAccount = null }: { children: React.ReactNode; initialAccount?: Account | null }) {
  const pathname = usePathname();
  const locale = useLocale();
  if (AUTH.has(pathname)) {
    return (
      <div className="auth-stage">
        <a href="#main" className="skip-link">{tx(locale, "İçeriğe geç", "Skip to content")}</a>
        <img className="auth-stage__floral auth-stage__floral--tl" src="/img/decor/floral-tl.webp" alt="" />
        <img className="auth-stage__floral auth-stage__floral--br" src="/img/decor/floral-br.webp" alt="" />
        <div className="auth-stage__logo">
          <Logo width={148} priority />
        </div>
        <main id="main" className="auth-stage__main">{children}</main>
        <Link href={`/${locale}`} className="auth-stage__back">
          ← {tx(locale, "Siteye dön", "Back to the site")}
        </Link>
      </div>
    );
  }
  return (
    <AccountProvider initial={initialAccount}>
      <Desk>{children}</Desk>
    </AccountProvider>
  );
}

function Desk({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();
  const { account } = useAccount();
  const [open, setOpen] = useState(false);
  const hello = firstName(account?.name || "");
  const nav = links(locale);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("is-locked", open);
    return () => document.documentElement.classList.remove("is-locked");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 901px)").matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  async function logout() {
    await fetch("/api/hesap", { method: "DELETE" });
    window.location.assign("/panel/giris");
  }

  return (
    <div className="desk-app">
      <a href="#main" className="skip-link">{tx(locale, "İçeriğe geç", "Skip to content")}</a>
      <header className="desk-top">
        <button
          type="button"
          className="desk-top__menu"
          aria-expanded={open}
          aria-controls="desk-side"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "close" : "menu"} size={20} />
          <span className="sr-only">{open ? tx(locale, "Menüyü kapat", "Close menu") : tx(locale, "Menüyü aç", "Open menu")}</span>
        </button>
        <Logo width={108} />
        <span className="desk-top__hello">{hello || tx(locale, "Panel", "Account")}</span>
      </header>
      <button
        type="button"
        className={"desk-backdrop" + (open ? " is-open" : "")}
        hidden={!open}
        aria-label={tx(locale, "Menüyü kapat", "Close menu")}
        onClick={() => setOpen(false)}
      />
      <div className="desk-body">
        <aside id="desk-side" className={"desk-side" + (open ? " is-open" : "")} data-side>
          <div className="desk-side__brand">
            <Link href={`/${locale}`} className="desk-mark">Davetanisi</Link>
            <p>{tx(locale, "Davetiyeleriniz ve katılım yanıtlarınız", "Your invitations and RSVPs")}</p>
          </div>
          <nav aria-label={tx(locale, "Panel", "Account")}>
            {nav.map((l) => (
              <Link key={l.href} href={l.href} className={on(pathname, l.href, l.exact) ? "is-on" : undefined} onClick={() => setOpen(false)}>
                <Icon name={l.icon} size={16} />
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="desk-side__foot">
            <Link href={`/${locale}`}>{tx(locale, "Siteye dön", "Back to the site")}</Link>
            <button type="button" onClick={logout}>{tx(locale, "Çıkış yap", "Sign out")}</button>
          </div>
        </aside>
        <main id="main" className="desk-main">{children}</main>
      </div>
    </div>
  );
}
