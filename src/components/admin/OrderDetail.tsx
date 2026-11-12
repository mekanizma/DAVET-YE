"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminSend } from "./AdminShell";
import { formatTL } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orderStatus";
import type { OrderRecord } from "@/lib/orderTypes";

export default function OrderDetail({ code }: { code: string }) {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await adminSend<{ order: OrderRecord }>(`/api/yonetim/siparisler/${encodeURIComponent(code)}`);
    setOrder(data.order);
    setNote(data.order.adminNote || "");
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function act(action: "onayla" | "reddet" | "not") {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const data = await adminSend<{ order: OrderRecord }>(`/api/yonetim/siparisler/${encodeURIComponent(code)}`, {
        method: "PATCH",
        body: JSON.stringify({ action, adminNote: note }),
      });
      setOrder(data.order);
      setInfo(action === "onayla" ? "Sipariş onaylandı." : action === "reddet" ? "Sipariş reddedildi." : "Not kaydedildi.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <p className="alert alert--error" role="alert">{error}</p>;
  if (!order) return <p role="status">Yükleniyor…</p>;

  return (
    <>
      <header className="adm-h">
        <div>
          <p className="eyebrow"><Link href="/yonetim/siparisler">Siparişler</Link></p>
          <h1 className="num">{order.code}</h1>
          <p>{order.title} · {order.kind === "gazete" ? "Gazete" : "Davetiye"}</p>
        </div>
        <span className={`pill pill--${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </header>

      <section className="adm-card">
        <h2>Tutar</h2>
        <p className="num" style={{ fontSize: "1.8rem", fontWeight: 700 }}>{formatTL(order.total)}</p>
        <ul className="kv">
          {order.lines.map((l) => (
            <li key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>{l.label}</span>
              <span className="num">{l.amount === 0 ? "Ücretsiz" : formatTL(l.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="adm-card">
        <h2>Müşteri</h2>
        <dl className="kv">
          <div><dt>Ad</dt><dd>{order.customer.name}</dd></div>
          <div><dt>E-posta</dt><dd><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a></dd></div>
          <div><dt>Telefon</dt><dd><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></dd></div>
          <div><dt>Gönderen</dt><dd>{order.senderName || "Henüz bildirilmedi"}</dd></div>
          {order.customerNote && <div><dt>Müşteri notu</dt><dd>{order.customerNote}</dd></div>}
        </dl>
      </section>

      {order.snapshot.__dekont && (
        <section className="adm-card">
          <h2>Dekont</h2>
          {order.snapshot.__dekont === "pdf" ? (
            <a className="btn btn--outline" href={`/api/yonetim/siparisler/${encodeURIComponent(order.code)}/dekont`} target="_blank" rel="noreferrer">
              PDF dekontu aç
            </a>
          ) : (
            <a href={`/api/yonetim/siparisler/${encodeURIComponent(order.code)}/dekont`} target="_blank" rel="noreferrer">
              <img className="dekont__admin" src={`/api/yonetim/siparisler/${encodeURIComponent(order.code)}/dekont`} alt={`${order.senderName || order.customer.name} dekontu`} />
            </a>
          )}
        </section>
      )}

      {Object.entries(order.snapshot).some(([k]) => !k.startsWith("__")) && (
        <section className="adm-card">
          <h2>Sipariş içeriği</h2>
          <dl className="kv">
            {Object.entries(order.snapshot).filter(([k]) => !k.startsWith("__")).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          {order.kind === "davetiye" && (
            <Link href={`/onizleme/tema/${order.template}`} className="btn btn--outline btn--sm" target="_blank">Şablonu aç</Link>
          )}
        </section>
      )}

      <section className="adm-card">
        <h2>Karar</h2>
        <ul className="timeline">
          <li>Oluşturuldu · <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString("tr-TR")}</time></li>
          {order.reportedAt && <li>Havale bildirildi · <time dateTime={order.reportedAt}>{new Date(order.reportedAt).toLocaleString("tr-TR")}</time></li>}
          {order.decidedAt && <li>Karar · <time dateTime={order.decidedAt}>{new Date(order.decidedAt).toLocaleString("tr-TR")}</time></li>}
        </ul>
        <label className="lbl" style={{ marginTop: 12 }}>
          Müşteriye not
          <textarea className="adm-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Reddederken gerekçe, onaylarken kısa mesaj yazın." />
        </label>
        {error && <p className="alert alert--error" role="alert">{error}</p>}
        {info && <p className="alert alert--success" role="status">{info}</p>}
        <div className="adm-actions">
          <button type="button" className="btn btn--dark" disabled={busy} onClick={() => act("onayla")}>Ödemeyi onayla</button>
          <button type="button" className="btn btn--outline" disabled={busy} onClick={() => act("reddet")}>Reddet</button>
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => act("not")}>Yalnızca notu kaydet</button>
        </div>
        <p className="field__hint">Onay, bankada tutarı ve açıklamadaki sipariş kodunu gördükten sonra verilir. Kart tahsilatı yoktur.</p>
      </section>
    </>
  );
}
