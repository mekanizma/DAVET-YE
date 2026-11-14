"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import { recordNewspaperVideo } from "@/lib/recordNewspaperVideo";
import { adminSend, useAdminQuery } from "./AdminShell";

interface Row {
  slug: string;
  title: string;
  cover: string;
  price: number;
  compareAt: number;
  hidden: boolean;
  base: { price: number; compareAt: number; hidden: boolean };
}

type PaperPayload = { items: { slug: string; title: string; cover: string; current: Row; base: Row["base"] }[] };

export default function PapersView() {
  const query = useAdminQuery<PaperPayload>("/api/yonetim/gazeteler");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<{ slug: string; title: string; locale: "tr" | "en"; status: string; scale: number } | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (query.data && rows === null) {
    setRows(query.data.items.map((i) => ({
      slug: i.slug,
      title: i.title,
      cover: i.cover,
      price: i.current.price,
      compareAt: i.current.compareAt,
      hidden: i.current.hidden,
      base: i.base,
    })));
  }

  function patch(slug: string, p: Partial<Row>) {
    setRows((list) => list?.map((r) => (r.slug === slug ? { ...r, ...p } : r)) ?? list);
    setInfo("");
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
    recordNewspaperVideo(frame, title, (status) => {
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
          <h1>Gazeteler</h1>
          <p>Her gazete şablonunun satış ve eski fiyatı. Gizli şablon listede ve siparişte görünmez. Türkçe indir ve İngilizce indir, hazır şablonu o dilde kapaktan son sayfaya kadar video olarak alır.</p>
        </div>
      </header>
      <div className="theme-list">
        {rows.map((r) => (
          <article key={r.slug} className="theme-edit">
            <div className="theme-edit__head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.cover} alt="" loading="lazy" decoding="async" />
              <div className="theme-edit__copy">
                <h3>{r.title}</h3>
                <p className="slug">{r.slug}</p>
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
      {job ? (
        <div className="rec-shade" role="dialog" aria-modal="true" aria-labelledby="rec-status">
          <p id="rec-status">{job.status}</p>
          <div className="rec-fit" style={{ width: Math.round(390 * job.scale), height: Math.round(844 * job.scale) }}>
            <iframe
              ref={frameRef}
              title={`${job.title} kaydı`}
              src={`/times/sablon/${encodeURIComponent(job.slug)}?kayit=1&dil=${job.locale}`}
              style={{ transform: `scale(${job.scale})` }}
            />
          </div>
          <button type="button" className="btn btn--outline rec-cancel" onClick={cancelDownload}>İptal</button>
        </div>
      ) : null}
      <div className="adm-save">
        <p>{info || loadError || `${rows.length} gazete`}</p>
        <button type="button" className="btn" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Kaydet"}</button>
      </div>
    </>
  );
}

