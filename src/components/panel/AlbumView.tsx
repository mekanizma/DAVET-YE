"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "../Icon";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import { longDate } from "@/lib/format";

type Photo = {
  id: string;
  orderCode: string;
  title: string;
  source: "wall" | "lens";
  createdAt: string;
  bytes: number;
  url?: string;
};

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function sourceLabel(source: Photo["source"], locale: Locale) {
  if (source === "lens") return tx(locale, "Anı çekimi", "Memory shot");
  return tx(locale, "Anı duvarı", "Memory wall");
}

export default function AlbumView() {
  const locale = useLocale();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stop = false;
    fetch("/api/album")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "");
        return data.photos as Photo[];
      })
      .then((rows) => {
        if (!stop) setPhotos(Array.isArray(rows) ? rows : []);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message || tx(locale, "Albüm açılamadı.", "The album could not be opened."));
      });
    return () => {
      stop = true;
    };
  }, [locale]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("is-locked");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("is-locked");
    };
  }, [open]);

  const groups = useMemo(() => {
    const map = new Map<string, { title: string; code: string; photos: Photo[] }>();
    for (const photo of photos || []) {
      const group = map.get(photo.orderCode) || { title: photo.title || photo.orderCode, code: photo.orderCode, photos: [] };
      group.photos.push(photo);
      map.set(photo.orderCode, group);
    }
    return [...map.values()];
  }, [photos]);

  async function remove(photo: Photo) {
    const sure = window.confirm(tx(locale, "Bu fotoğraf albümden silinsin mi?", "Remove this photo from the album?"));
    if (!sure) return;
    setBusy(true);
    const res = await fetch(`/api/album/${photo.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError(tx(locale, "Fotoğraf silinemedi.", "The photo could not be removed."));
      return;
    }
    setPhotos((cur) => (cur || []).filter((item) => item.id !== photo.id));
    setOpen(null);
  }

  if (!photos && !error) return <p className="wz-loading" role="status">{tx(locale, "Yükleniyor…", "Loading…")}</p>;

  return (
    <div className="album">
      {error ? <p className="iv-status iv-status--err" role="alert">{error}</p> : null}
      {photos && photos.length === 0 ? (
        <p className="dash__card">
          {tx(
            locale,
            "Henüz fotoğraf yok. Misafirler anı duvarına yüklediğinde veya anı çekimi yaptığında fotoğraflar burada görünür.",
            "No photos yet. They appear here when guests upload to the memory wall or take a memory shot.",
          )}
        </p>
      ) : null}
      {groups.map((group) => (
        <section key={group.code} className="dash__card" aria-labelledby={`album-${group.code}`}>
          <h2 id={`album-${group.code}`}>{group.title}</h2>
          <p className="muted num">{group.code} · {group.photos.length}</p>
          <ul className="album-grid">
            {group.photos.map((photo, index) => (
              <li key={photo.id} className="album-item">
                <button type="button" className="album-card" onClick={() => setOpen(photo)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url || `/api/album/${photo.id}`} alt={tx(locale, `Albüm fotoğrafı ${index + 1}`, `Album photo ${index + 1}`)} />
                </button>
                <a className="album-dl" href={`/api/album/${photo.id}?indir=1`} download aria-label={tx(locale, "İndir", "Download")}>
                  <Icon name="download" size={16} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {open ? (
        <div className="album-lightbox" role="dialog" aria-modal="true" aria-label={tx(locale, "Fotoğraf", "Photo")}>
          <button type="button" className="album-lightbox__backdrop" aria-label={tx(locale, "Kapat", "Close")} onClick={() => setOpen(null)} />
          <div className="album-lightbox__sheet">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.url || `/api/album/${open.id}`} alt={sourceLabel(open.source, locale)} />
            <p>
              {sourceLabel(open.source, locale)}
              {" · "}
              {Number.isNaN(Date.parse(open.createdAt)) ? "" : longDate(new Date(open.createdAt), locale)}
            </p>
            <div className="album-lightbox__actions">
              <a className="btn btn--dark btn--lg" href={`/api/album/${open.id}?indir=1`} download>
                <Icon name="download" size={16} /> {tx(locale, "İndir", "Download")}
              </a>
              <button type="button" className="btn btn--outline btn--lg" onClick={() => remove(open)} disabled={busy}>
                <Icon name="trash" size={16} /> {tx(locale, "Sil", "Remove")}
              </button>
              <button type="button" className="btn btn--outline btn--lg" onClick={() => setOpen(null)}>
                {tx(locale, "Kapat", "Close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
