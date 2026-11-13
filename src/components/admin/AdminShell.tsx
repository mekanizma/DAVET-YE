"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "../Icon";

const LINKS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/yonetim", label: "Özet", icon: "home", exact: true },
  { href: "/yonetim/siparisler", label: "Siparişler", icon: "wallet" },
  { href: "/yonetim/etsy", label: "Etsy", icon: "globe" },
  { href: "/yonetim/sablonlar", label: "Şablonlar", icon: "sparkle" },
  { href: "/yonetim/fiyatlar", label: "Fiyatlar", icon: "tag" },
  { href: "/yonetim/gazeteler", label: "Gazeteler", icon: "doc" },
  { href: "/yonetim/odeme", label: "Ödeme hesabı", icon: "envelope" },
];

function on(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export async function adminSend<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.assign("/yonetim/giris");
    throw new Error("Giriş gerekli");
  }
  if (!res.ok) throw new Error((data as { error?: string }).error || "İşlem başarısız");
  return data as T;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let stop = false;
    adminSend<{ counts: { bildirildi: number } }>("/api/yonetim/ozet")
      .then((d) => { if (!stop) setPending(d.counts.bildirildi); })
      .catch(() => undefined);
    return () => { stop = true; };
  }, [pathname]);

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
