"use client";

import { useEffect, useMemo, useState } from "react";
import { adminSend } from "./AdminShell";
import { EVENT_LABELS, type EventType } from "@/data/themes";
import { foldTr } from "@/lib/format";
import type { ThemeLive } from "@/lib/catalog";

interface Row {
  slug: string;
  title: string;
  cover: string;
  eventTypes: EventType[];
  price: number;
  compareAt: number;
  featured: boolean;
  hidden: boolean;
  badge: "" | "featured" | "new";
  base: ThemeLive;
}

export default function ThemesView() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"" | "featured" | "hidden">("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminSend<{ items: { slug: string; title: string; cover: string; eventTypes: EventType[]; current: ThemeLive; base: ThemeLive }[] }>("/api/yonetim/sablonlar")
      .then((d) => setRows(d.items.map((i) => ({ ...i, ...i.current }))))
      .catch((e: Error) => setError(e.message));
  }, []);

  const shown = useMemo(() => {
    const f = foldTr(q.trim());
    return (rows ?? []).filter((r) => {
      if (only === "featured" && !r.featured) return false;
      if (only === "hidden" && !r.hidden) return false;
      if (!f) return true;
      return foldTr(r.title).includes(f) || foldTr(r.slug).includes(f);
    });
  }, [rows, q, only]);

  function patch(slug: string, p: Partial<Row>) {
    setRows((list) => list?.map((r) => (r.slug === slug ? { ...r, ...p } : r)) ?? list);
    setInfo("");
  }

  async function save() {
    if (!rows) return;
    setBusy(true);
    setError("");
    try {
      await adminSend("/api/yonetim/sablonlar", {
        method: "PUT",
        body: JSON.stringify({
          items: rows.map((r) => ({
            slug: r.slug,
            price: Number(r.price),
            compareAt: Number(r.compareAt),
            featured: r.featured,
            hidden: r.hidden,
            badge: r.badge,
          })),
        }),
      });
      setInfo("Şablonlar kaydedildi. Sitedeki fiyatlar yenilemeyle güncellenir.");
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
          <h1>Şablonlar</h1>
          <p>Her davetiyenin satış fiyatını, karşılaştırma fiyatını, ana sayfada öne çıkmasını ve yayından kalkmasını buradan yönetin. Gizli şablon listelerde görünmez, yeni sipariş almaz.</p>
        </div>
      </header>
      <input className="adm-search" type="search" placeholder="Şablon ara" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Şablon ara" />
      <div className="adm-filters">
        {([["", "Tümü"], ["featured", "Öne çıkan"], ["hidden", "Gizli"]] as const).map(([id, label]) => (
          <button key={label} type="button" className={`adm-chip${only === id ? " is-on" : ""}`} onClick={() => setOnly(id)}>{label}</button>
        ))}
      </div>
      <div className="theme-list">
        {shown.map((r) => (
          <article key={r.slug} className="theme-edit">
            <div className="theme-edit__head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.cover} alt="" />
              <div>
                <h3>{r.title}</h3>
                <p className="slug">{r.slug}</p>
                <p className="slug">{r.eventTypes.map((e) => EVENT_LABELS[e]).join(" · ")}</p>
              </div>
            </div>
            <div className="adm-grid2">
              <label className="lbl">Satış fiyatı (TL)
                <input inputMode="numeric" value={r.price} onChange={(e) => patch(r.slug, { price: Number(e.target.value.replace(/\D/g, "") || 0) })} />
              </label>
              <label className="lbl">Eski fiyat (üstü çizili)
                <input inputMode="numeric" value={r.compareAt} onChange={(e) => patch(r.slug, { compareAt: Number(e.target.value.replace(/\D/g, "") || 0) })} />
              </label>
            </div>
            <label className="lbl">Rozet
              <select value={r.badge} onChange={(e) => patch(r.slug, { badge: e.target.value as Row["badge"] })}>
                <option value="">Yok</option>
                <option value="featured">Öne çıkan</option>
                <option value="new">Yeni</option>
              </select>
            </label>
            <div className="checks">
              <label><input type="checkbox" checked={r.featured} onChange={(e) => patch(r.slug, { featured: e.target.checked })} /> Ana sayfada göster</label>
              <label><input type="checkbox" checked={r.hidden} onChange={(e) => patch(r.slug, { hidden: e.target.checked })} /> Yayından kaldır</label>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => patch(r.slug, { ...r.base })}>Varsayılan</button>
            </div>
          </article>
        ))}
      </div>
      <div className="adm-save">
        <p>{info || error || `${shown.length} şablon listeleniyor`}</p>
        <button type="button" className="btn" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Kaydet"}</button>
      </div>
    </>
  );
}
