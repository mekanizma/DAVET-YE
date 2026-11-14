"use client";

import Link from "next/link";
import { useAdminQuery } from "./AdminShell";
import { formatTL } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orderStatus";
import type { OrderRecord } from "@/lib/orderTypes";

interface Summary {
  paymentReady: boolean;
  bankName: string;
  accountHolder: string;
  iban: string;
  counts: {
    bekliyor: number;
    bildirildi: number;
    onaylandi: number;
    reddedildi: number;
    themes: number;
    hiddenThemes: number;
    newspapers: number;
  };
  approvedTotal: number;
  recent: OrderRecord[];
}

export default function DashboardView() {
  const { data, error } = useAdminQuery<Summary>("/api/yonetim/ozet");

  if (error) return <p className="alert alert--error" role="alert">{error}</p>;
  if (!data) return <p role="status">Yükleniyor…</p>;
  const c = data.counts;

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Özet</h1>
          <p>Kart ödemeleri Shopier POS ile alınır ve onaylanınca sipariş kendiliğinden açılır.</p>
        </div>
      </header>

      <div className="adm-stats">
        <article className="adm-stat adm-stat--alert">
          <span>Onay bekleyen</span>
          <strong>{c.bildirildi}</strong>
        </article>
        <article className="adm-stat">
          <span>Ödeme bekleniyor</span>
          <strong>{c.bekliyor}</strong>
        </article>
        <article className="adm-stat adm-stat--ok">
          <span>Onaylanan ciro</span>
          <strong>{formatTL(data.approvedTotal)}</strong>
        </article>
        <article className="adm-stat">
          <span>Reddedilen</span>
          <strong>{c.reddedildi}</strong>
        </article>
      </div>

      <section className="adm-card">
        <h2>Ödeme</h2>
        <p>Müşteri ödeme sayfasında IBAN görmez. Tahsilat Shopier kart ekranından yapılır.</p>
        <div className="adm-actions">
          <Link href="/yonetim/siparisler?durum=bekliyor" className="btn btn--outline btn--sm">Ödeme bekleyenler</Link>
          <Link href="/yonetim/siparisler?durum=bildirildi" className="btn btn--outline btn--sm">Onay kuyruğu</Link>
        </div>
      </section>

      <section className="adm-card">
        <h2>Katalog</h2>
        <p>{c.themes - c.hiddenThemes} davetiye yayında · {c.hiddenThemes} gizli · {c.newspapers} gazete</p>
        <div className="adm-actions">
          <Link href="/yonetim/sablonlar" className="btn btn--outline btn--sm">Şablonlar</Link>
          <Link href="/yonetim/fiyatlar" className="btn btn--outline btn--sm">Fiyatlar</Link>
          <Link href="/yonetim/gazeteler" className="btn btn--outline btn--sm">Gazeteler</Link>
          <Link href="/yonetim/etsy" className="btn btn--outline btn--sm">Etsy</Link>
        </div>
      </section>

      <section>
        <h2 style={{ margin: "8px 0" }}>Son siparişler</h2>
        {data.recent.length === 0 ? (
          <p className="muted">Henüz sipariş yok. Kart ödemesi Shopier’de onaylanınca sipariş burada görünür.</p>
        ) : (
          <div className="ord-list">
            {data.recent.map((o) => (
              <Link key={o.code} href={`/yonetim/siparisler/${o.code}`} className="ord">
                <div className="ord__top">
                  <div>
                    <strong>{o.customer.name}</strong>
                    <small style={{ display: "block" }}>{o.title} · {o.kind === "gazete" ? "Gazete" : "Davetiye"}</small>
                    {o.snapshot.__dekont ? <small style={{ display: "block" }}>Dekont yüklendi</small> : null}
                  </div>
                  <span className={`pill pill--${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </div>
                <div className="ord__bot">
                  <span className="num muted">{o.code}</span>
                  <span className="num">{formatTL(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
