"use client";

import { useEffect, useState } from "react";
import { adminSend } from "./AdminShell";

interface Row {
  slug: string;
  title: string;
  cover: string;
  price: number;
  compareAt: number;
  hidden: boolean;
  base: { price: number; compareAt: number; hidden: boolean };
}

export default function PapersView() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminSend<{ items: { slug: string; title: string; cover: string; current: Row; base: Row["base"] }[] }>("/api/yonetim/gazeteler")
      .then((d) => setRows(d.items.map((i) => ({
        slug: i.slug,
        title: i.title,
        cover: i.cover,
        price: i.current.price,
        compareAt: i.current.compareAt,
        hidden: i.current.hidden,
        base: i.base,
      }))))
      .catch((e: Error) => setError(e.message));
  }, []);

  function patch(slug: string, p: Partial<Row>) {
    setRows((list) => list?.map((r) => (r.slug === slug ? { ...r, ...p } : r)) ?? list);
  }

  async function save() {
    if (!rows) return;
    setBusy(true);
    setError("");
    try {
      await adminSend("/api/yonetim/gazeteler", {
        method: "PUT",
        body: JSON.stringify({
          items: rows.map((r) => ({ slug: r.slug, price: Number(r.price) || 0, compareAt: Number(r.compareAt) || 0, hidden: r.hidden })),
        }),
      });
      setInfo("Gazete fiyatları kaydedildi.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  if (error && !rows) return <p className="alert alert--error">{error}</p>;
  if (!rows) return <p role="status">Yükleniyor…</p>;

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Gazeteler</h1>
          <p>Her gazete şablonunun satış ve eski fiyatı. Gizli şablon listede ve siparişte görünmez.</p>
        </div>
      </header>
      <div className="theme-list">
        {rows.map((r) => (
          <article key={r.slug} className="theme-edit">
            <h3>{r.title}</h3>
            <p className="slug">{r.slug}</p>
            <div className="adm-grid2">
              <label className="lbl">Satış fiyatı (TL)
                <input inputMode="numeric" value={r.price} onChange={(e) => patch(r.slug, { price: Number(e.target.value.replace(/\D/g, "") || 0) })} />
              </label>
              <label className="lbl">Eski fiyat
                <input inputMode="numeric" value={r.compareAt} onChange={(e) => patch(r.slug, { compareAt: Number(e.target.value.replace(/\D/g, "") || 0) })} />
              </label>
            </div>
            <div className="checks">
              <label><input type="checkbox" checked={r.hidden} onChange={(e) => patch(r.slug, { hidden: e.target.checked })} /> Yayından kaldır</label>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => patch(r.slug, r.base)}>Varsayılan</button>
            </div>
          </article>
        ))}
      </div>
      <div className="adm-save">
        <p>{info || error || `${rows.length} gazete`}</p>
        <button type="button" className="btn" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Kaydet"}</button>
      </div>
    </>
  );
}

