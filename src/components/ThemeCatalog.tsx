"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import ProductCard from "./ProductCard";
import { useCatalog } from "@/components/CatalogProvider";
import { applyTheme } from "@/lib/catalog";
import { EVENT_LABELS, allTags, popularity, themes, type EventType } from "@/data/themes";
import { foldTr } from "@/lib/format";

export interface CatalogInitial {
  q: string;
  etkinlik: "" | EventType;
  etiket: string;
  sirala: "onerilen" | "fiyat" | "populer";
}

export default function ThemeCatalog({
  initial,
  fixedEvent,
}: {
  initial: CatalogInitial;
  /** On event landing pages the event is fixed and the control is hidden. */
  fixedEvent?: EventType;
}) {
  const cat = useCatalog();
  const [q, setQ] = useState(initial.q);
  const [event, setEvent] = useState<"" | EventType>(fixedEvent ?? initial.etkinlik);
  const [tag, setTag] = useState(initial.etiket);
  const [sort, setSort] = useState<CatalogInitial["sirala"]>(initial.sirala);
  const [cols, setCols] = useState<"auto" | "4" | "6">("auto");
  const [coversOnly, setCoversOnly] = useState(false);

  // reflect filters in the URL without a navigation
  useEffect(() => {
    if (fixedEvent) return;
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (event) p.set("etkinlik", event);
    if (tag) p.set("etiket", tag);
    if (sort !== "onerilen") p.set("sirala", sort);
    const s = p.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [q, event, tag, sort, fixedEvent]);

  const results = useMemo(() => {
    const needle = foldTr(q.trim());
    let list = themes.map((t) => applyTheme(t, cat)).filter((t) => !cat.themes[t.slug]?.hidden).filter((t) => {
      if (event && !t.eventTypes.includes(event)) return false;
      if (tag && !t.tags.includes(tag)) return false;
      if (needle) {
        const hay = foldTr([t.title, t.slug.replace(/-/g, " "), ...t.tags].join(" "));
        return needle.split(/\s+/).every((w) => hay.includes(w));
      }
      return true;
    });
    list = [...list];
    if (sort === "fiyat") list.sort((a, b) => a.price - b.price || a.order - b.order);
    else if (sort === "populer") list.sort((a, b) => popularity(b) - popularity(a));
    else list.sort((a, b) => a.order - b.order);
    return list;
  }, [q, event, tag, sort, cat]);

  const filtered = Boolean(q || (event && !fixedEvent) || tag);
  const reset = () => {
    setQ("");
    if (!fixedEvent) setEvent("");
    setTag("");
    setSort("onerilen");
  };

  return (
    <div className="catalog">
      <div role="search" className="filterbar" aria-label="Etkinliğe göre filtrele">
        <div className={`filterbar__inner${fixedEvent ? " filterbar__inner--3" : ""}`}>
          <div className="filterbar__field filterbar__field--search">
            <label className="sr-only" htmlFor="cat-q">Davetiyelerde ara</label>
            <Icon name="search" size={18} className="filterbar__icon" />
            <input
              id="cat-q"
              type="search"
              className="filterbar__input"
              placeholder="Davetiye adı veya stil ara..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
          {!fixedEvent && (
            <div className="filterbar__field">
              <label htmlFor="cat-event" className="filterbar__label">Etkinlik</label>
              <div className="filterbar__select">
                <Icon name="calendar" size={16} />
                <select id="cat-event" value={event} onChange={(e) => setEvent(e.target.value as "" | EventType)}>
                  <option value="">Tüm etkinlikler</option>
                  {(Object.keys(EVENT_LABELS) as EventType[]).map((k) => (
                    <option key={k} value={k}>{EVENT_LABELS[k]}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="filterbar__field">
            <label htmlFor="cat-tag" className="filterbar__label">Etiket</label>
            <div className="filterbar__select">
              <Icon name="tag" size={16} />
              <select id="cat-tag" value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="">Tüm etiketler</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filterbar__field">
            <label htmlFor="cat-sort" className="filterbar__label">Sırala:</label>
            <div className="filterbar__select">
              <Icon name="sort" size={16} />
              <select id="cat-sort" value={sort} onChange={(e) => setSort(e.target.value as CatalogInitial["sirala"])}>
                <option value="onerilen">Önerilen</option>
                <option value="fiyat">Artan fiyat</option>
                <option value="populer">Popüler</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="catalog__meta">
        <p className="catalog__count" role="status" aria-live="polite">
          {results.length} davetiye
        </p>
        <div className="catalog__tools">
          <div className="seg" role="group" aria-label="Sütun">
            <span className="seg__label" aria-hidden="true">Sütun</span>
            {(["auto", "4", "6"] as const).map((c) => (
              <button
                key={c}
                type="button"
                className="seg__btn"
                aria-pressed={cols === c}
                onClick={() => setCols(c)}
              >
                {c === "auto" ? "Otomatik" : c}
              </button>
            ))}
          </div>
          <label className="check check--sm">
            <input type="checkbox" checked={coversOnly} onChange={(e) => setCoversOnly(e.target.checked)} />
            Yalnız kapaklar
          </label>
        </div>
        <p className="catalog__flourish" aria-hidden="true">Sizin için özenle seçildi</p>
      </div>

      {results.length === 0 ? (
        <div className="empty" role="status">
          <Icon name="search" size={28} />
          <h2>Aramanıza uygun davetiye bulunamadı</h2>
          <p>Farklı bir kelime deneyin ya da filtreleri temizleyin.</p>
          <button type="button" className="btn btn--dark" onClick={reset}>
            Filtreleri temizle
          </button>
        </div>
      ) : (
        <div className={`catalog__grid catalog__grid--${cols}`}>
          {results.map((t, i) => (
            <ProductCard key={t.slug} theme={t} coverOnly={coversOnly} priority={i < 3 && !filtered} />
          ))}
        </div>
      )}
    </div>
  );
}
