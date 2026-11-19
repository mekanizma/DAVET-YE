"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Icon from "@/components/Icon";
import { adminCached, adminSend } from "./AdminShell";

type Kind = "gazete" | "davetiye" | "any";

type Item = {
  code: string;
  kind?: Kind;
  productSlug?: string;
  productTitle?: string;
  newspaperSlug: string;
  newspaperTitle: string;
  note: string;
  status: "active" | "redeemed" | "revoked";
  createdAt: string;
  redeemedAt: string | null;
  useCount: number;
};

const STATUS_TR: Record<Item["status"], string> = {
  active: "Hazır",
  redeemed: "Kullanıldı",
  revoked: "İptal",
};

function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function isOpen(item: Item) {
  const slug = item.productSlug || item.newspaperSlug;
  return item.kind === "any" || !slug || slug === "__any__";
}

function itemLabel(item: Item) {
  if (isOpen(item)) return "Müşteri gazete veya davetiye seçer (1 ücretsiz)";
  if (item.kind === "davetiye") return `Davetiye · ${item.productTitle || item.newspaperTitle}`;
  if (item.kind === "gazete") return `Gazete · ${item.productTitle || item.newspaperTitle}`;
  return item.productTitle || item.newspaperTitle;
}

function lockBadge(item: Item) {
  if (isOpen(item)) return "Açık · gazete veya davetiye";
  if (item.kind === "davetiye") return "Kilitli · davetiye";
  return "Kilitli · gazete";
}

export default function EtsyView() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Item | null>(null);

  const apply = useCallback((d: { items: Item[] }) => {
    setItems(d.items);
  }, []);

  const load = useCallback(() => {
    adminSend<{ items: Item[] }>("/api/yonetim/etsy")
      .then(apply)
      .catch((e: Error) => setError(e.message));
  }, [apply]);

  useLayoutEffect(() => {
    const hit = adminCached<{ items: Item[] }>("/api/yonetim/etsy");
    if (hit) apply(hit);
  }, [apply]);

  useEffect(() => {
    load();
  }, [load]);

  async function createCode() {
    setBusy(true);
    setError("");
    setInfo("");
    setCreated(null);
    try {
      const d = await adminSend<{ item: Item }>("/api/yonetim/etsy", {
        method: "POST",
        body: JSON.stringify({ note }),
      });
      setCreated(d.item);
      setNote("");
      setInfo(`${d.item.code} hazır · 1 ücretsiz ürün (müşteri gazete veya davetiye seçer). PDF indiriliyor…`);
      load();
      window.setTimeout(() => downloadPdf(d.item.code), 120);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oluşturulamadı");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(code: string) {
    if (!confirm(`${code} iptal edilsin mi? Müşteri bir daha giremez.`)) return;
    setBusy(true);
    setError("");
    try {
      await adminSend("/api/yonetim/etsy", {
        method: "PATCH",
        body: JSON.stringify({ code, action: "revoke" }),
      });
      setInfo(`${code} iptal edildi.`);
      if (created?.code === code) setCreated(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "İptal edilemedi");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setInfo(`${code} panoya kopyalandı.`);
    } catch {
      setError("Kopyalanamadı.");
    }
  }

  function downloadPdf(code: string) {
    window.location.assign(`/api/yonetim/etsy/${encodeURIComponent(code)}/pdf`);
  }

  if (error && !items) return <p className="alert alert--error">{error}</p>;
  if (!items) return <p role="status">Yükleniyor…</p>;

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Etsy</h1>
          <p>
            Tek kod üretilir. Müşteri girişten sonra <strong>gazete</strong> veya <strong>davetiye</strong> seçer,
            sonra 1 ücretsiz tasarımı kilitler. İngilizce PDF Etsy dijital teslimatına yüklenir.
          </p>
        </div>
      </header>

      <section className="adm-card etsy-create">
        <h2>Tek kod + PDF</h2>
        <p className="adm-note" style={{ marginTop: 0 }}>
          Ürün tipi seçilmez. Müşteri kodla girdikten sonra gazete veya davetiye ekranına yönlenir; seçim koda kilitlenir.
        </p>
        <label className="lbl">
          Not (Etsy sipariş no vb.)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opsiyonel"
            maxLength={200}
          />
        </label>
        <div className="adm-actions" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn--dark" disabled={busy} onClick={createCode}>
            {busy ? "Hazırlanıyor…" : "Kod oluştur"}
          </button>
        </div>
        {(info || error) && (
          <p className={error ? "alert alert--error" : "adm-note"} style={{ marginTop: 12 }}>
            {error || info}
          </p>
        )}
        {created && (
          <div className="etsy-created">
            <p className="etsy-created__code">{created.code}</p>
            <p>
              <strong>1 ücretsiz ürün:</strong> müşteri girişte gazete veya davetiye seçer.
              PDF’de kod, link ve İngilizce adımlar var — Etsy’ye dijital dosya olarak yükleyin.
            </p>
            <div className="adm-actions">
              <button type="button" className="btn btn--dark btn--sm" onClick={() => downloadPdf(created.code)}>
                <Icon name="download" size={14} /> PDF indir
              </button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => copyCode(created.code)}>
                <Icon name="copy" size={14} /> Kodu kopyala
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="adm-card" style={{ marginTop: 16 }}>
        <h2>Kodlar ({items.length})</h2>
        {!items.length ? (
          <p className="adm-note">Henüz kod yok. Yukarıdan oluşturun.</p>
        ) : (
          <ul className="etsy-list">
            {items.map((item) => (
              <li key={item.code} className="etsy-row">
                <div className="etsy-row__main">
                  <strong className="etsy-row__code">{item.code}</strong>
                  <span className={`etsy-badge etsy-badge--${item.status}`}>{STATUS_TR[item.status]}</span>
                  <span className="etsy-badge etsy-badge--free">{lockBadge(item)}</span>
                  <p>
                    {itemLabel(item)}
                    {item.note ? ` · ${item.note}` : ""}
                  </p>
                  <small>
                    {shortDate(item.createdAt)}
                    {item.useCount > 0 ? ` · ${item.useCount} giriş` : ""}
                  </small>
                </div>
                <div className="etsy-row__actions">
                  {item.status !== "revoked" && (
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => downloadPdf(item.code)}>
                      PDF
                    </button>
                  )}
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => copyCode(item.code)}>
                    Kopyala
                  </button>
                  {item.status !== "revoked" && (
                    <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => revoke(item.code)}>
                      İptal
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
