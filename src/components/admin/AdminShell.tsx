"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import Icon, { type IconName } from "../Icon";

const LINKS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/yonetim", label: "Özet", icon: "home", exact: true },
  { href: "/yonetim/siparisler", label: "Siparişler", icon: "wallet" },
  { href: "/yonetim/etsy", label: "Etsy", icon: "globe" },
  { href: "/yonetim/sablonlar", label: "Şablonlar", icon: "sparkle" },
  { href: "/yonetim/fiyatlar", label: "Fiyatlar", icon: "tag" },
  { href: "/yonetim/gazeteler", label: "Gazeteler", icon: "doc" },
  { href: "/yonetim/odeme", label: "Ödeme", icon: "lock" },
];

function on(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

const readCache = new Map<string, { at: number; data: unknown }>();
const READ_MS = 20_000;

export function adminCached<T>(url: string): T | null {
  const hit = readCache.get(url);
  if (!hit || Date.now() - hit.at > READ_MS) return null;
  return hit.data as T;
}

type AdminInit = RequestInit & { fresh?: boolean };

export async function adminSend<T>(url: string, init?: AdminInit): Promise<T> {
  const fresh = Boolean(init?.fresh);
  const { fresh: _ignored, ...rest } = init ?? {};
  const method = (rest.method || "GET").toUpperCase();
  if (method !== "GET") readCache.clear();
  else if (!fresh) {
    const hit = adminCached<T>(url);
    if (hit) return hit;
  }
  const res = await fetch(url, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(rest.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    readCache.clear();
    window.location.assign("/yonetim/giris");
    throw new Error("Giriş gerekli");
  }
  if (!res.ok) throw new Error((data as { error?: string }).error || "İşlem başarısız");
  if (method === "GET") readCache.set(url, { at: Date.now(), data });
  return data as T;
}

export function useAdminQuery<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    let stop = false;
    const hit = adminCached<T>(url);
    if (hit) setData(hit);
    adminSend<T>(url)
      .then((next) => {
        if (!stop) {
          setData(next);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (!stop) setError(e.message);
      });
    return () => {
      stop = true;
    };
  }, [url]);

  return { data, error };
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let stop = false;
    const pull = () => {
      adminSend<{ counts: { bildirildi: number } }>("/api/yonetim/ozet", { fresh: true })
        .then((d) => { if (!stop) setPending(d.counts.bildirildi); })
        .catch(() => undefined);
    };
    pull();
    const timer = window.setInterval(pull, 45_000);
    window.addEventListener("focus", pull);
    return () => {
      stop = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", pull);
    };
  }, []);

  async function logout() {
    await fetch("/api/yonetim/cikis", { method: "POST" });
    window.location.assign("/yonetim/giris");
  }

  const tabs = LINKS.slice(0, 4);

  return (
    <div className="adm">
      <aside className="adm-side">
        <p className="adm-side__brand">Davetanisi</p>
        <p style={{ marginTop: 4, fontSize: "0.8rem", opacity: 0.75 }}>Yönetim</p>
        <nav aria-label="Yönetim">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={on(pathname, l.href, l.exact) ? "is-on" : undefined}>
              <Icon name={l.icon} size={16} />
              {l.label}
              {l.href === "/yonetim/siparisler" && pending > 0 ? ` (${pending})` : ""}
            </Link>
          ))}
        </nav>
        <div className="adm-side__foot">
          <Link href="/tr">Siteye dön</Link>
          <button type="button" onClick={logout}>Çıkış yap</button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <div className="adm-brand">
            <strong>Davetanisi</strong>
            <span>Yönetim paneli</span>
          </div>
          <button type="button" className="btn btn--outline btn--sm" onClick={logout}>Çıkış</button>
        </header>
        <div className="adm-body">{children}</div>
      </div>

      <nav className="adm-tabbar" aria-label="Yönetim sekmeleri">
        {tabs.map((l) => (
          <Link key={l.href} href={l.href} className={on(pathname, l.href, l.exact) ? "is-on" : undefined}>
            <Icon name={l.icon} size={18} />
            {l.label}
            {l.href === "/yonetim/siparisler" && pending > 0 && <span className="adm-dot">{pending}</span>}
          </Link>
        ))}
        <button type="button" className={menu ? "is-on" : undefined} onClick={() => setMenu(true)} aria-expanded={menu}>
          <Icon name="menu" size={18} />
          Menü
        </button>
      </nav>

      {menu && (
        <div className="adm-sheet" role="presentation" onClick={() => setMenu(false)}>
          <div className="adm-sheet__panel" role="dialog" aria-label="Diğer sayfalar" onClick={(e) => e.stopPropagation()}>
            {LINKS.slice(4).map((l) => (
              <Link key={l.href} href={l.href} className="sheet-link" onClick={() => setMenu(false)}>
                <Icon name={l.icon} size={16} /> {l.label}
              </Link>
            ))}
            <Link href="/tr" onClick={() => setMenu(false)}>Siteye dön</Link>
            <button type="button" className="sheet-link" onClick={logout}>Çıkış yap</button>
          </div>
        </div>
      )}
    </div>
  );
}
