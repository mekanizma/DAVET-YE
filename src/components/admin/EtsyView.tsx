"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { adminSend } from "./AdminShell";

type PaperOpt = { slug: string; title: string; titleEn: string };

type Item = {
  code: string;
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

export default function EtsyView() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [papers, setPapers] = useState<PaperOpt[]>([]);
  const [slug, setSlug] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Item | null>(null);

  const load = useCallback(() => {
    adminSend<{ items: Item[]; papers: PaperOpt[] }>("/api/yonetim/etsy")
      .then((d) => {
        setItems(d.items);
        setPapers(d.papers);
        setSlug((prev) => prev || d.papers[0]?.slug || "");
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createCode() {
    if (!slug) return;
    setBusy(true);
    setError("");
    setInfo("");
    setCreated(null);
    try {
      const d = await adminSend<{ item: Item }>("/api/yonetim/etsy", {
        method: "POST",
        body: JSON.stringify({ newspaperSlug: slug, note }),
      });
      setCreated(d.item);
      setNote("");
      setInfo(`Kod oluşturuldu: ${d.item.code}`);
      load();
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
            Etsy’de sattığınız gazete için erişim kodu ve İngilizce kullanım PDF’i oluşturun. Müşteri kodla stüdyoya girip gazetesini tasarlayıp indirebilir.
          </p>
        </div>
      </header>

      <section className="adm-card etsy-create">
        <h2>Yeni kod + PDF</h2>
        <div className="adm-grid2">
          <label className="lbl">
            Gazete şablonu
            <select value={slug} onChange={(e) => setSlug(e.target.value)}>
              {papers.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title} / {p.titleEn}
                </option>
              ))}
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
          <button type="button" className="btn" disabled={busy || !slug} onClick={createCode}>
            {busy ? "Oluşturuluyor…" : "Kod oluştur"}
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
              {created.newspaperTitle} · PDF İngilizce kullanım kılavuzu + kod içerir. Etsy dijital ürün olarak yükleyin.
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
                  <p>
                    {item.newspaperTitle}
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
