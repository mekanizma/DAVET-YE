"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Icon from "@/components/Icon";
import { adminCached, adminSend } from "./AdminShell";

type Kind = "gazete" | "davetiye";

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

const KIND_TR: Record<Kind, string> = {
  gazete: "Gazete",
  davetiye: "Davetiye",
};

function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function itemKind(item: Item): Kind {
  return item.kind === "davetiye" ? "davetiye" : "gazete";
}

function isOpen(item: Item) {
  const slug = item.productSlug || item.newspaperSlug;
  return !slug || slug === "__any__";
}

function itemLabel(item: Item) {
  if (isOpen(item)) {
    return itemKind(item) === "davetiye"
      ? "Müşteri 1 davetiye seçer"
      : "Müşteri 1 gazete seçer";
  }
  return item.productTitle || item.newspaperTitle;
}

export default function EtsyView() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [kind, setKind] = useState<Kind>("gazete");
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
        body: JSON.stringify({ kind, note }),
      });
      setCreated(d.item);
      setNote("");
      setInfo(`${d.item.code} hazır · 1 ücretsiz ${KIND_TR[kind].toLowerCase()} (müşteri seçer). PDF indiriliyor…`);
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
            Kod yalnızca <strong>ürün tipine</strong> bağlıdır (gazete veya davetiye). Müşteri kodla catalogdan
            <strong> 1 ücretsiz</strong> ürün seçer. İngilizce PDF Etsy dijital teslimatına yüklenir.
          </p>
        </div>
      </header>

      <section className="adm-card etsy-create">
        <h2>Ürün tipi için kod + PDF</h2>
        <p className="adm-note" style={{ marginTop: 0 }}>
          Şablon seçilmez. Müşteri girişten sonra istediği 1 gazete veya 1 davetiyeyi kendisi seçer; seçim koda kilitlenir.
        </p>
        <div className="adm-grid2">
          <label className="lbl">
            Ürün tipi
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value === "davetiye" ? "davetiye" : "gazete")}
            >
              <option value="gazete">Gazete — müşteri 1 gazete seçer</option>
              <option value="davetiye">Davetiye — müşteri 1 davetiye seçer</option>
            </select>
          </label>
          <label className="lbl">
            Not (Etsy sipariş no vb.)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opsiyonel"
              maxLength={200}
            />
          </label>
        </div>
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
              <strong>1 ücretsiz {KIND_TR[itemKind(created)].toLowerCase()}:</strong> müşteri katalogdan seçer.
              PDF’de kod ve İngilizce kullanım adımları var — Etsy’ye dijital dosya olarak yükleyin.
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
                  <span className="etsy-badge etsy-badge--free">1 ücretsiz · {KIND_TR[itemKind(item)]}</span>
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
