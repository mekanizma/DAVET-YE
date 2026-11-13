"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import ProductCard from "./ProductCard";
import { useCatalog } from "@/components/CatalogProvider";
import { localizeTheme, tagLabel } from "@/i18n/catalog";
import { marketing } from "@/i18n/marketing";
import { useLocale } from "@/i18n/provider";
import { applyTheme } from "@/lib/catalog";
import { allTags, popularity, themes, type EventType } from "@/data/themes";
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
  const locale = useLocale();
  const en = locale === "en";
  const events = marketing(locale).events;
  const [q, setQ] = useState(initial.q);
  const [event, setEvent] = useState<"" | EventType>(fixedEvent ?? initial.etkinlik);
  const [tag, setTag] = useState(initial.etiket);
  const [sort, setSort] = useState<CatalogInitial["sirala"]>(initial.sirala);
  const [cols, setCols] = useState<"auto" | "4" | "6">("auto");
  const [coversOnly, setCoversOnly] = useState(false);
  const text = en
    ? {
        filter: "Filter by event",
        search: "Search invitations",
        placeholder: "Search by name or style...",
        event: "Event",
        allEvents: "All events",
        tag: "Tag",
        allTags: "All tags",
        sort: "Sort",
        recommended: "Recommended",
        price: "Lowest price",
        popular: "Popular",
        columns: "Columns",
        auto: "Auto",
        covers: "Covers only",
        flourish: "Chosen with care for you",
        emptyTitle: "No invitation matches your search",
        emptyText: "Try a different word, or clear the filters.",
        clear: "Clear filters",
      }
    : {
        filter: "Etkinliğe göre filtrele",
        search: "Davetiyelerde ara",
        placeholder: "Davetiye adı veya stil ara...",
        event: "Etkinlik",
        allEvents: "Tüm etkinlikler",
        tag: "Etiket",
        allTags: "Tüm etiketler",
        sort: "Sırala:",
        recommended: "Önerilen",
        price: "Artan fiyat",
        popular: "Popüler",
        columns: "Sütun",
        auto: "Otomatik",
        covers: "Yalnız kapaklar",
        flourish: "Sizin için özenle seçildi",
        emptyTitle: "Aramanıza uygun davetiye bulunamadı",
        emptyText: "Farklı bir kelime deneyin ya da filtreleri temizleyin.",
        clear: "Filtreleri temizle",
      };

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
        const view = localizeTheme(t, locale);
        const hay = foldTr([view.title, t.title, t.slug.replace(/-/g, " "), ...view.tags, ...t.tags].join(" "));
        return needle.split(/\s+/).every((w) => hay.includes(w));
      }
      return true;
    });
    list = [...list];
    if (sort === "fiyat") list.sort((a, b) => a.price - b.price || a.order - b.order);
    else if (sort === "populer") list.sort((a, b) => popularity(b) - popularity(a));
    else list.sort((a, b) => a.order - b.order);
    return list;
  }, [q, event, tag, sort, cat, locale]);

  const filtered = Boolean(q || (event && !fixedEvent) || tag);
  const reset = () => {
    setQ("");
    if (!fixedEvent) setEvent("");
    setTag("");
    setSort("onerilen");
  };
  const countLabel = en
    ? `${results.length} ${results.length === 1 ? "invitation" : "invitations"}`
    : `${results.length} davetiye`;

  return (
    <div className="catalog">
      <div role="search" className="filterbar" aria-label={text.filter}>
        <div className={`filterbar__inner${fixedEvent ? " filterbar__inner--3" : ""}`}>
          <div className="filterbar__field filterbar__field--search">
            <label className="sr-only" htmlFor="cat-q">{text.search}</label>
            <Icon name="search" size={18} className="filterbar__icon" />
            <input
              id="cat-q"
              type="search"
              className="filterbar__input"
              placeholder={text.placeholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
          {!fixedEvent && (
            <div className="filterbar__field">
              <label htmlFor="cat-event" className="filterbar__label">{text.event}</label>
              <div className="filterbar__select">
                <Icon name="calendar" size={16} />
                <select id="cat-event" value={event} onChange={(e) => setEvent(e.target.value as "" | EventType)}>
                  <option value="">{text.allEvents}</option>
                  {(Object.keys(events) as EventType[]).map((k) => (
                    <option key={k} value={k}>{events[k]}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="filterbar__field">
            <label htmlFor="cat-tag" className="filterbar__label">{text.tag}</label>
            <div className="filterbar__select">
              <Icon name="tag" size={16} />
              <select id="cat-tag" value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="">{text.allTags}</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{tagLabel(t, locale)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filterbar__field">
            <label htmlFor="cat-sort" className="filterbar__label">{text.sort}</label>
            <div className="filterbar__select">
              <Icon name="sort" size={16} />
              <select id="cat-sort" value={sort} onChange={(e) => setSort(e.target.value as CatalogInitial["sirala"])}>
                <option value="onerilen">{text.recommended}</option>
                <option value="fiyat">{text.price}</option>
                <option value="populer">{text.popular}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="catalog__meta">
        <p className="catalog__count" role="status" aria-live="polite">
          {countLabel}
        </p>
        <div className="catalog__tools">
          <div className="seg" role="group" aria-label={text.columns}>
            <span className="seg__label" aria-hidden="true">{text.columns}</span>
            {(["auto", "4", "6"] as const).map((c) => (
              <button
                key={c}
                type="button"
                className="seg__btn"
                aria-pressed={cols === c}
                onClick={() => setCols(c)}
              >
                {c === "auto" ? text.auto : c}
              </button>
            ))}
          </div>
          <label className="check check--sm">
            <input type="checkbox" checked={coversOnly} onChange={(e) => setCoversOnly(e.target.checked)} />
            {text.covers}
          </label>
        </div>
        <p className="catalog__flourish" aria-hidden="true">{text.flourish}</p>
      </div>

      {results.length === 0 ? (
        <div className="empty" role="status">
          <Icon name="search" size={28} />
          <h2>{text.emptyTitle}</h2>
          <p>{text.emptyText}</p>
          <button type="button" className="btn btn--dark" onClick={reset}>
            {text.clear}
          </button>
        </div>
      ) : (
        <div className={`catalog__grid catalog__grid--${cols}`}>
          {results.map((t, i) => (
            <ProductCard key={t.slug} theme={localizeTheme(t, locale)} coverOnly={coversOnly} priority={i < 3 && !filtered} />
          ))}
        </div>
      )}
    </div>
  );
}
