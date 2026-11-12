"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "../Icon";
import Logo from "../Logo";
import { AccountProvider, useAccount } from "./account";

const AUTH = new Set(["/panel/giris", "/panel/kayit", "/panel/sifremi-unuttum", "/panel/sifre-yenile"]);

const LINKS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/panel", label: "Özet", icon: "home", exact: true },
  { href: "/panel/tasarimlar", label: "Tasarımlarım", icon: "sparkle" },
  { href: "/panel/hesap", label: "Hesap", icon: "user" },
];

function on(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "";
}

export default function PanelFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (AUTH.has(pathname)) {
    return (
      <div className="auth-stage">
        <a href="#main" className="skip-link">İçeriğe geç</a>
        <img className="auth-stage__floral auth-stage__floral--tl" src="/img/decor/floral-tl.webp" alt="" />
        <img className="auth-stage__floral auth-stage__floral--br" src="/img/decor/floral-br.webp" alt="" />
        <div className="auth-stage__logo">
          <Logo width={148} priority />
        </div>
        <main id="main" className="auth-stage__main">{children}</main>
        <Link href="/tr" className="auth-stage__back">
          ← Siteye dön
        </Link>
      </div>
    );
  }
  return (
    <AccountProvider>
      <Desk>{children}</Desk>
    </AccountProvider>
  );
}

function Desk({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { account } = useAccount();
  const [open, setOpen] = useState(false);
  const hello = firstName(account?.name || "");

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
      <a href="#main" className="skip-link">İçeriğe geç</a>
      <header className="desk-top">
        <button
          type="button"
          className="desk-top__menu"
          aria-expanded={open}
          aria-controls="desk-side"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "close" : "menu"} size={20} />
          <span className="sr-only">{open ? "Menüyü kapat" : "Menüyü aç"}</span>
        </button>
        <Logo width={108} />
        <span className="desk-top__hello">{hello || "Panel"}</span>
      </header>
      <button
        type="button"
        className={"desk-backdrop" + (open ? " is-open" : "")}
        hidden={!open}
        aria-label="Menüyü kapat"
        onClick={() => setOpen(false)}
      />
      <div className="desk-body">
        <aside id="desk-side" className={"desk-side" + (open ? " is-open" : "")} data-side>
          <div className="desk-side__brand">
            <Link href="/tr" className="desk-mark">Davetanisi</Link>
            <p>Davetiyeleriniz ve katılım yanıtlarınız</p>
          </div>
          <nav aria-label="Panel">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={on(pathname, l.href, l.exact) ? "is-on" : undefined} onClick={() => setOpen(false)}>
                <Icon name={l.icon} size={16} />
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="desk-side__foot">
            <Link href="/tr">Siteye dön</Link>
            <button type="button" onClick={logout}>Çıkış yap</button>
          </div>
        </aside>
        <main id="main" className="desk-main">{children}</main>
      </div>
    </div>
  );
}
