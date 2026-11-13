"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "../Icon";
import { getNewspaper } from "@/data/newspapers";
import { getTheme } from "@/data/themes";
import { localizeNewspaper, themeTitle } from "@/i18n/catalog";
import { lp, withLocaleQuery, type Locale } from "@/i18n/locale";
import { statusLabel } from "@/i18n/product";
import { useLocale } from "@/i18n/provider";
import { downloadBlob, formatTL, longDate } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orderStatus";
import { EMPTY_NEWSPAPER_DRAFT, normalizeNewspaperDraft } from "@/lib/newspaperDraft";
import type { OrderRecord } from "@/lib/orderTypes";
import type { Rsvp } from "@/lib/storage";
import { NEWSPAPER_DRAFT, useDraft, useLocalJson } from "@/lib/storage";
import { useAccount } from "./account";
import DraftCard from "./DraftCard";
import ShareLinkCard from "@/components/share/ShareLinkCard";
import type { SharePublic } from "@/lib/shareSlug";

interface RsvpRow extends Rsvp {
  slug: string;
}

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function readRsvps(): RsvpRow[] {
  const rows: RsvpRow[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i) ?? "";
      const m = /^dvg:rsvp:(.+):v1$/.exec(k);
      if (!m) continue;
      const list = JSON.parse(window.localStorage.getItem(k) ?? "[]") as Rsvp[];
      list.forEach((r) => rows.push({ ...r, slug: m[1] }));
    }
  } catch {
    /* storage unavailable */
  }
  return rows.sort((a, b) => b.at.localeCompare(a.at));
}

function csvCell(v: string | number | boolean) {
  const s = String(v).replace(/"/g, '""');
  return /^[=+\-@]/.test(s) ? `"'${s}"` : `"${s}"`;
}

const RANK: Record<string, number> = { onaylandi: 0, bildirildi: 1, bekliyor: 2, reddedildi: 3 };

function orderLink(order: OrderRecord, locale: Locale) {
  const again = order.status === "reddedildi";
  const pay = again ? tx(locale, "Yeniden bildir", "Send again") : tx(locale, "Ödemeye dön", "Back to payment");
  if (order.status === "onaylandi") {
    if (order.kind === "davetiye" && order.template) return { href: withLocaleQuery(locale, `/onizleme/tema/${order.template}?taslak=1`), label: tx(locale, "Davetiyeyi aç", "Open the invitation") };
    return { href: lp(locale, "/gazete-tasarla"), label: tx(locale, "Gazeteyi aç", "Open the newspaper") };
  }
  if (order.kind === "gazete") return { href: lp(locale, "/gazete-tasarla"), label: pay };
  return { href: lp(locale, "/davetiye-olustur/odeme"), label: pay };
}

function themeName(slug: string, locale: Locale) {
  const theme = getTheme(slug);
  return theme ? themeTitle(theme, locale) : slug;
}

function OrderShare({ code, email, locale }: { code: string; email: string; locale: Locale }) {
  const [share, setShare] = useState<SharePublic | null>(null);
  useEffect(() => {
    if (!code || !email) return;
    let stop = false;
    fetch(`/api/siparis/${encodeURIComponent(code)}?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!stop) setShare((data?.share as SharePublic) || null);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [code, email]);
  return <ShareLinkCard share={share} locale={locale} />;
}

function orderTitle(order: OrderRecord, locale: Locale) {
  if (order.kind === "davetiye" && order.template) {
    const theme = getTheme(order.template);
    if (theme) return themeTitle(theme, locale);
  }
  if (order.kind === "gazete" && order.template) {
    const paper = getNewspaper(order.template);
    if (paper) return localizeNewspaper(paper, locale).title;
  }
  return order.title;
}

export default function Dashboard() {
  const locale = useLocale();
  const { account, failed } = useAccount();
  const { draft } = useDraft();
  const [paper] = useLocalJson(NEWSPAPER_DRAFT, EMPTY_NEWSPAPER_DRAFT);
  const newspaper = normalizeNewspaperDraft(paper);
  const [deviceOrders, setDeviceOrders] = useState<OrderRecord[]>([]);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRsvps(readRsvps());
    setMounted(true);
  }, []);

  useEffect(() => {
    const lookups = [
      draft.order?.code && draft.order.email ? { code: draft.order.code, email: draft.order.email } : null,
      newspaper.orderCode && newspaper.orderEmail ? { code: newspaper.orderCode, email: newspaper.orderEmail } : null,
    ].filter((item): item is { code: string; email: string } => Boolean(item));
    if (!lookups.length) {
      setDeviceOrders([]);
      return;
    }
    let stop = false;
    Promise.all(
      lookups.map((item) =>
        fetch(`/api/siparis/${encodeURIComponent(item.code)}?email=${encodeURIComponent(item.email)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => (data?.order ? (data.order as OrderRecord) : null))
          .catch(() => null),
      ),
    ).then((rows) => {
      if (stop) return;
      const seen = new Set<string>();
      setDeviceOrders(rows.filter((row): row is OrderRecord => {
        if (!row || seen.has(row.code)) return false;
        seen.add(row.code);
        return true;
      }));
    });
    return () => {
      stop = true;
    };
  }, [draft.order?.code, draft.order?.email, newspaper.orderCode, newspaper.orderEmail]);

  if (!mounted || (!account && !failed)) return <p className="wz-loading" role="status">{tx(locale, "Yükleniyor…", "Loading…")}</p>;

  if (!account) {
    return (
      <div className="auth-card">
        <h1>{tx(locale, "Panel", "Account")}</h1>
        <p>{tx(locale, "Hesap bilgisi alınamadı.", "We couldn’t load the account.")}</p>
        <Link href="/panel/giris" className="btn btn--dark btn--lg btn--block">{tx(locale, "Giriş yap", "Sign in")}</Link>
      </div>
    );
  }

  const hello = account.name.trim().split(/\s+/)[0] || "";
  const orders = [...account.orders];
  for (const extra of deviceOrders) {
    if (!orders.some((order) => order.code === extra.code)) orders.push(extra);
  }
  orders.sort((a, b) => (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9) || b.createdAt.localeCompare(a.createdAt));

  function exportCsv() {
    const head = locale === "en"
      ? ["Invitation", "Name", "RSVP", "Guests", "Note", "Date"]
      : ["Davetiye", "Ad", "Katılım", "Kişi", "Not", "Tarih"];
    const lines = [head.map(csvCell).join(",")].concat(
      rsvps.map((r) => {
        const attending = r.attending ? tx(locale, "Katılıyor", "Attending") : tx(locale, "Katılmıyor", "Not attending");
        const when = Number.isNaN(Date.parse(r.at)) ? r.at : longDate(new Date(r.at), locale);
        return [themeName(r.slug, locale), r.name, attending, r.count, r.note, when].map(csvCell).join(",");
      }),
    );
    downloadBlob(locale === "en" ? "rsvp-replies.csv" : "katilim-yanitlari.csv", new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  }

  const replyCount = rsvps.length === 0
    ? tx(locale, "Henüz yanıt yok", "No replies yet")
    : rsvps.length === 1
      ? tx(locale, "1 yanıt", "1 reply")
      : tx(locale, `${rsvps.length} yanıt`, `${rsvps.length} replies`);
  const orderCount = orders.length === 0
    ? tx(locale, "Sipariş yok", "No orders")
    : orders.length === 1
      ? tx(locale, "1 sipariş", "1 order")
      : tx(locale, `${orders.length} sipariş`, `${orders.length} orders`);

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <p className="eyebrow">{tx(locale, "Panel", "Account")}</p>
          <h1>{hello ? tx(locale, `Merhaba, ${hello}`, `Hello, ${hello}`) : tx(locale, "Merhaba", "Hello")}</h1>
          <p className="dash__mail">{account.email}</p>
        </div>
      </header>

      <div className="desk-tiles">
        <Link href="/panel/tasarimlar" className="desk-tile">
          <Icon name="sparkle" size={18} />
          <strong>{tx(locale, "Tasarımlarım", "My designs")}</strong>
          <span>{tx(locale, "Davetiye taslağınız", "Your invitation draft")}</span>
        </Link>
        <a href="#katilim" className="desk-tile">
          <Icon name="heart" size={18} />
          <strong>{tx(locale, "Katılım yanıtları", "RSVPs")}</strong>
          <span>{replyCount}</span>
        </a>
        <a href="#siparisler" className="desk-tile">
          <Icon name="wallet" size={18} />
          <strong>{tx(locale, "Siparişler", "Orders")}</strong>
          <span>{orderCount}</span>
        </a>
      </div>

      <DraftCard hideEmpty />

      <section className="dash__card" id="siparisler" aria-labelledby="d-orders">
        <h2 id="d-orders">{tx(locale, "Siparişler", "Orders")}</h2>
        {orders.length === 0 ? (
          <p>{tx(locale, "Bu hesaba bağlı sipariş yok. Ödeme onaylanınca sipariş burada görünür.", "There are no orders on this account. An order appears here once the payment is confirmed.")}</p>
        ) : (
          <ul className="dash__list">
            {orders.map((o) => {
              const action = orderLink(o, locale);
              const created = Number.isNaN(Date.parse(o.createdAt)) ? o.createdAt : longDate(new Date(o.createdAt), locale);
              return (
                <li key={o.code}>
                  <div>
                    <strong>{orderTitle(o, locale)}</strong>
                    <small className="num">{o.code} · {created}</small>
                    <span className={`pill pill--${o.status}`}>{statusLabel(o.status, locale, STATUS_LABEL[o.status] ?? o.status)}</span>
                  </div>
                  <span className="num">{formatTL(o.total, locale)}</span>
                  <div className="dash__actions">
                    <Link href={action.href} className="btn btn--outline btn--sm">{action.label}</Link>
                  </div>
                  <OrderShare code={o.code} email={o.customer.email} locale={locale} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dash__card" id="katilim" aria-labelledby="d-rsvp">
        <h2 id="d-rsvp">{tx(locale, "Katılım yanıtları", "RSVPs")}</h2>
        {rsvps.length === 0 ? (
          <p>{tx(locale, "Önizlemedeki katılım formunu doldurduğunuzda yanıtlar bu cihazda listelenir.", "When someone fills in the RSVP form on the preview, the replies are listed on this device.")}</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">{tx(locale, "Katılım yanıtları", "RSVPs")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{tx(locale, "Ad", "Name")}</th>
                    <th scope="col">{tx(locale, "Durum", "Status")}</th>
                    <th scope="col">{tx(locale, "Kişi", "Guests")}</th>
                    <th scope="col">{tx(locale, "Davetiye", "Invitation")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((r, i) => (
                    <tr key={`${r.slug}-${r.at}-${i}`}>
                      <th scope="row">{r.name}</th>
                      <td>{r.attending ? tx(locale, "Katılıyor", "Attending") : tx(locale, "Katılmıyor", "Not attending")}</td>
                      <td className="num">{r.attending ? r.count : "—"}</td>
                      <td>{themeName(r.slug, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn--outline btn--sm" onClick={exportCsv}>
              <Icon name="download" size={14} /> {tx(locale, "CSV indir", "Download CSV")}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
