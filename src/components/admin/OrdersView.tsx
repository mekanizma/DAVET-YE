"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminSend } from "./AdminShell";
import { formatTL } from "@/lib/format";
import { STATUS_LABEL, ORDER_STATUSES } from "@/lib/orderStatus";
import type { OrderRecord } from "@/lib/orderTypes";

const FILTERS = [
  { id: "", label: "Tümü" },
  { id: "bildirildi", label: "Onay bekleyen" },
  { id: "bekliyor", label: "Ödeme bekleyen" },
  { id: "onaylandi", label: "Onaylanan" },
  { id: "reddedildi", label: "Reddedilen" },
];

export default function OrdersView() {
  const params = useSearchParams();
  const initial = params.get("durum") || "";
  const [durum, setDurum] = useState(ORDER_STATUSES.includes(initial as never) || initial === "" ? initial : "");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      const p = new URLSearchParams();
      if (durum) p.set("durum", durum);
      if (q.trim()) p.set("q", q.trim());
      setError("");
      adminSend<{ orders: OrderRecord[] }>(`/api/yonetim/siparisler?${p.toString()}`)
        .then((d) => setOrders(d.orders))
        .catch((e: Error) => setError(e.message));
    }, 200);
    return () => window.clearTimeout(t);
  }, [durum, q]);

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Siparişler</h1>
          <p>Müşteri ad soyad ve dekontla ödemeyi bildirdiğinde sipariş onay kuyruğuna düşer. Tutarı, dekontu ve açıklamadaki kodu kontrol edip onaylayın veya reddedin.</p>
        </div>
      </header>
      <div className="adm-filters" role="tablist" aria-label="Durum">
        {FILTERS.map((f) => (
          <button key={f.id || "all"} type="button" className={`adm-chip${durum === f.id ? " is-on" : ""}`} onClick={() => setDurum(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <input className="adm-search" type="search" placeholder="Kod, ad, e-posta veya telefon" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Sipariş ara" />
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {orders === null ? <p role="status">Yükleniyor…</p> : orders.length === 0 ? (
        <p className="muted">Bu süzgeçte sipariş yok.</p>
      ) : (
        <div className="ord-list">
          {orders.map((o) => (
            <Link key={o.code} href={`/yonetim/siparisler/${o.code}`} className="ord">
              <div>
                <div className="ord__top">
                  <strong>{o.customer.name}</strong>
                  <span className={`pill pill--${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </div>
                <small>{o.title}</small>
                {o.snapshot.__dekont ? <small>Dekont yüklendi</small> : null}
                <div className="ord__bot" style={{ marginTop: 6 }}>
                  <span className="muted">{o.customer.phone}</span>
                  <span className="num">{formatTL(o.total)}</span>
                </div>
                <small className="num">{o.code} · {new Date(o.createdAt).toLocaleString("tr-TR")}</small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
