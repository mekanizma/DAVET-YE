"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "../Icon";
import { getTheme } from "@/data/themes";
import { downloadBlob, formatTL } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orderStatus";
import { EMPTY_NEWSPAPER_DRAFT, normalizeNewspaperDraft } from "@/lib/newspaperDraft";
import type { OrderRecord } from "@/lib/orderTypes";
import type { Rsvp } from "@/lib/storage";
import { NEWSPAPER_DRAFT, useDraft, useLocalJson } from "@/lib/storage";
import { useAccount } from "./account";
import DraftCard from "./DraftCard";

interface RsvpRow extends Rsvp {
  slug: string;
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

function orderLink(order: OrderRecord) {
  if (order.status === "onaylandi") {
    if (order.kind === "davetiye" && order.template) return { href: `/onizleme/tema/${order.template}?taslak=1`, label: "Davetiyeyi aç" };
    return { href: "/tr/gazete-tasarla", label: "Gazeteyi aç" };
  }
  if (order.kind === "gazete") return { href: "/tr/gazete-tasarla", label: order.status === "reddedildi" ? "Yeniden bildir" : "Ödemeye dön" };
  return { href: "/tr/davetiye-olustur/odeme", label: order.status === "reddedildi" ? "Yeniden bildir" : "Ödemeye dön" };
}

export default function Dashboard() {
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

  if (!mounted || (!account && !failed)) return <p className="wz-loading" role="status">Yükleniyor…</p>;

  if (!account) {
    return (
      <div className="auth-card">
        <h1>Panel</h1>
        <p>Hesap bilgisi alınamadı.</p>
        <Link href="/panel/giris" className="btn btn--dark btn--lg btn--block">Giriş yap</Link>
      </div>
    );
  }

  const hello = account.name.trim().split(/\s+/)[0] || "Merhaba";
  const orders = [...account.orders];
  for (const extra of deviceOrders) {
    if (!orders.some((order) => order.code === extra.code)) orders.push(extra);
  }
  orders.sort((a, b) => (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9) || b.createdAt.localeCompare(a.createdAt));

  function exportCsv() {
    const head = ["Davetiye", "Ad", "Katılım", "Kişi", "Not", "Tarih"];
    const lines = [head.map(csvCell).join(",")].concat(
      rsvps.map((r) =>
        [getTheme(r.slug)?.title ?? r.slug, r.name, r.attending ? "Katılıyor" : "Katılmıyor", r.count, r.note, r.at].map(csvCell).join(","),
      ),
    );
    downloadBlob("katilim-yanitlari.csv", new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  }

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <p className="eyebrow">Panel</p>
          <h1>{account.name.trim() ? `Merhaba, ${hello}` : "Merhaba"}</h1>
          <p className="dash__mail">{account.email}</p>
        </div>
      </header>

      <div className="desk-tiles">
        <Link href="/panel/tasarimlar" className="desk-tile">
          <Icon name="sparkle" size={18} />
          <strong>Tasarımlarım</strong>
          <span>Davetiye taslağınız</span>
        </Link>
        <a href="#katilim" className="desk-tile">
          <Icon name="heart" size={18} />
          <strong>Katılım yanıtları</strong>
          <span>{rsvps.length === 0 ? "Henüz yanıt yok" : `${rsvps.length} yanıt`}</span>
        </a>
        <a href="#siparisler" className="desk-tile">
          <Icon name="wallet" size={18} />
          <strong>Siparişler</strong>
          <span>{orders.length === 0 ? "Sipariş yok" : `${orders.length} sipariş`}</span>
        </a>
      </div>

      <DraftCard hideEmpty />

      <section className="dash__card" id="siparisler" aria-labelledby="d-orders">
        <h2 id="d-orders">Siparişler</h2>
        {orders.length === 0 ? (
          <p>Bu hesaba bağlı sipariş yok. Ödeme onaylanınca sipariş burada görünür.</p>
        ) : (
          <ul className="dash__list">
            {orders.map((o) => {
              const action = orderLink(o);
              return (
                <li key={o.code}>
                  <div>
                    <strong>{o.title}</strong>
                    <small className="num">{o.code} · {new Date(o.createdAt).toLocaleDateString("tr-TR")}</small>
                    <span className={`pill pill--${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
                  </div>
                  <span className="num">{formatTL(o.total)}</span>
                  <div className="dash__actions">
                    <Link href={action.href} className="btn btn--outline btn--sm">{action.label}</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dash__card" id="katilim" aria-labelledby="d-rsvp">
        <h2 id="d-rsvp">Katılım yanıtları</h2>
        {rsvps.length === 0 ? (
          <p>Önizlemedeki katılım formunu doldurduğunuzda yanıtlar bu cihazda listelenir.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">Katılım yanıtları</caption>
                <thead>
                  <tr><th scope="col">Ad</th><th scope="col">Durum</th><th scope="col">Kişi</th><th scope="col">Davetiye</th></tr>
                </thead>
                <tbody>
                  {rsvps.map((r, i) => (
                    <tr key={`${r.slug}-${r.at}-${i}`}>
                      <th scope="row">{r.name}</th>
                      <td>{r.attending ? "Katılıyor" : "Katılmıyor"}</td>
                      <td className="num">{r.attending ? r.count : "—"}</td>
                      <td>{getTheme(r.slug)?.title ?? r.slug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn--outline btn--sm" onClick={exportCsv}>
              <Icon name="download" size={14} /> CSV indir
            </button>
          </>
        )}
      </section>
    </div>
  );
}
