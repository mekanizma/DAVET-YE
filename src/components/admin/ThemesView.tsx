"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import { adminSend, useAdminQuery } from "./AdminShell";
import { EVENT_LABELS, type EventType } from "@/data/themes";
import { foldTr } from "@/lib/format";
import { recordTemplateVideo } from "@/lib/recordTemplateVideo";
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

type ThemePayload = { items: { slug: string; title: string; cover: string; eventTypes: EventType[]; current: ThemeLive; base: ThemeLive }[] };

export default function ThemesView() {
  const query = useAdminQuery<ThemePayload>("/api/yonetim/sablonlar");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"" | "featured" | "hidden">("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<{ slug: string; title: string; locale: "tr" | "en"; status: string; scale: number } | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (query.data && rows === null) setRows(query.data.items.map((i) => ({ ...i, ...i.current })));

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

  useEffect(() => {
    if (!job) return;
    const slug = job.slug;
    const locale = job.locale;
    const title = locale === "en" ? `${job.title} EN` : job.title;
    const frame = frameRef.current;
    if (!frame) return;
    const ac = new AbortController();
    abortRef.current = ac;
    let alive = true;
    recordTemplateVideo(frame, title, (status) => {
      if (alive) setJob((cur) => (cur && cur.slug === slug && cur.locale === locale ? { ...cur, status } : cur));
    }, ac.signal)
      .catch((err: unknown) => {
        if (!alive || ac.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Video hazırlanamadı.");
      })
      .finally(() => {
        if (alive) setJob(null);
      });
    return () => {
      alive = false;
      ac.abort();
    };
    // Status text updates must not restart the recording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.slug, job?.locale]);

  function startDownload(slug: string, title: string, locale: "tr" | "en") {
    if (job) return;
    const scale = Math.min(1, (window.innerWidth - 32) / 390, (window.innerHeight - 180) / 844);
    setError("");
    setJob({
      slug,
      title,
      locale,
      status: locale === "en" ? "İngilizce şablon açılıyor…" : "Şablon açılıyor…",
      scale: Math.max(0.34, scale),
    });
  }

  function cancelDownload() {
    abortRef.current?.abort();
    setJob(null);
  }

  const loadError = error || query.error;
  if (loadError && !rows) return <p className="alert alert--error">{loadError}</p>;
  if (!rows) return <p role="status">Yükleniyor…</p>;

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Şablonlar</h1>
          <p>Her davetiyenin satış fiyatını, karşılaştırma fiyatını, ana sayfada öne çıkmasını ve yayından kalkmasını buradan yönetin. Gizli şablon listelerde görünmez, yeni sipariş almaz. Türkçe indir ve İngilizce indir, hazır şablonu o dilde kapak ve isim sayfalarıyla birlikte video olarak alır.</p>
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
              <img src={r.cover} alt="" loading="lazy" decoding="async" />
              <div className="theme-edit__copy">
                <h3>{r.title}</h3>
                <p className="slug">{r.slug}</p>
                <p className="slug">{r.eventTypes.map((e) => EVENT_LABELS[e]).join(" · ")}</p>
              </div>
              <div className="theme-edit__dls">
                <button type="button" className="btn btn--outline theme-edit__dl" disabled={Boolean(job)} onClick={() => startDownload(r.slug, r.title, "tr")}>
                  <Icon name="download" size={16} /> {job?.slug === r.slug && job.locale === "tr" ? "Hazırlanıyor…" : "Türkçe indir"}
                </button>
                <button type="button" className="btn btn--outline theme-edit__dl" disabled={Boolean(job)} onClick={() => startDownload(r.slug, r.title, "en")}>
                  <Icon name="download" size={16} /> {job?.slug === r.slug && job.locale === "en" ? "Hazırlanıyor…" : "İngilizce indir"}
                </button>
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
      {job ? (
        <div className="rec-shade" role="dialog" aria-modal="true" aria-labelledby="rec-status">
          <p id="rec-status">{job.status}</p>
          <div className="rec-fit" style={{ width: Math.round(390 * job.scale), height: Math.round(844 * job.scale) }}>
            <iframe
              ref={frameRef}
              title={`${job.title} kaydı`}
              src={`/onizleme/tema/${encodeURIComponent(job.slug)}?kayit=1&dil=${job.locale}`}
              style={{ transform: `scale(${job.scale})` }}
            />
          </div>
          <button type="button" className="btn btn--outline rec-cancel" onClick={cancelDownload}>İptal</button>
        </div>
      ) : null}
      <div className="adm-save">
        <p>{info || loadError || `${shown.length} şablon listeleniyor`}</p>
        <button type="button" className="btn" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Kaydet"}</button>
      </div>
    </>
  );
}
