"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import ComponentIcon from "@/components/newspaper/ComponentIcon";
import {
  NEWSPAPER_COMPONENT_CATEGORIES,
  getNewspaperComponent,
  searchNewspaperComponents,
  type NewspaperComponentItem,
} from "@/data/newspaperComponents";
import type { NewspaperExtra } from "@/lib/newspaperExtras";

export default function ComponentsPanel({
  locale,
  extras,
  activePageId,
  onAdd,
  onRemove,
}: {
  locale: "tr" | "en";
  extras: NewspaperExtra[];
  activePageId: string;
  onAdd: (item: NewspaperComponentItem) => void;
  onRemove: (id: string) => void;
}) {
  const en = locale === "en";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const items = useMemo(() => searchNewspaperComponents(query, category), [query, category]);
  const pageExtras = extras.filter((e) => e.pageId === activePageId);

  return (
    <div className="ns-comp">
      <p className="ns-hint">
        {en
          ? "Browse real icons, graphics and stickers — click to add free to the page."
          : "Gerçek ikon, grafik ve çıkartmaları gezin — tıklayınca ücretsiz sayfaya eklenir."}
      </p>

      <label className="ns-comp__search">
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={en ? "Search elements…" : "Öğe ara…"}
          aria-label={en ? "Search elements" : "Öğe ara"}
        />
      </label>

      <div className="ns-comp__cats" role="tablist" aria-label={en ? "Categories" : "Kategoriler"}>
        {NEWSPAPER_COMPONENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            className={category === cat.id ? "is-on" : undefined}
            onClick={() => setCategory(cat.id)}
          >
            {en ? cat.labelEn : cat.label}
          </button>
        ))}
      </div>

      <p className="ns-comp__count">
        {en ? `${items.length} free elements` : `${items.length} ücretsiz öğe`}
      </p>

      <div className="ns-comp__grid" role="list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ns-comp__card ns-comp__card--${item.kind}`}
            role="listitem"
            onClick={() => onAdd(item)}
            title={en ? `Add ${item.labelEn}` : `${item.label} ekle`}
          >
            <span className="ns-comp__preview" aria-hidden="true">
              <ComponentPreview item={item} />
            </span>
            <span className="ns-comp__name">{en ? item.labelEn : item.label}</span>
          </button>
        ))}
      </div>

      {pageExtras.length ? (
        <div className="ns-comp__placed">
          <h3>{en ? "On this page" : "Bu sayfada"}</h3>
          <ul>
            {pageExtras.map((ex) => {
              const meta = getNewspaperComponent(ex.componentId);
              const label =
                ex.kind === "text"
                  ? ex.text || (en ? "Text" : "Metin")
                  : en
                    ? meta?.labelEn || ex.componentId
                    : meta?.label || ex.componentId;
              return (
                <li key={ex.id}>
                  <span className="ns-comp__placed-preview" aria-hidden="true">
                    {ex.kind === "icon" ? (
                      <ComponentIcon name={ex.icon} size={18} stroke={ex.stroke || "#c9a45a"} />
                    ) : ex.kind === "image" && ex.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ex.src} alt="" />
                    ) : (
                      <span className="ns-comp__dot" />
                    )}
                  </span>
                  <span>{label}</span>
                  <button type="button" onClick={() => onRemove(ex.id)} aria-label={en ? "Remove" : "Kaldır"}>
                    <Icon name="trash" size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ComponentPreview({ item }: { item: NewspaperComponentItem }) {
  if (item.kind === "image" && item.defaults.src) {
    return (
      <Image
        src={String(item.defaults.src)}
        alt=""
        width={96}
        height={96}
        className="ns-comp__img"
        sizes="96px"
      />
    );
  }
  if (item.kind === "text") {
    return (
      <span className="ns-comp__text" style={{ color: String(item.defaults.color || "#1a1510") }}>
        {String(item.defaults.text || "Aa")}
      </span>
    );
  }
  if (item.kind === "line") {
    return <span className="ns-comp__line" style={{ background: String(item.defaults.stroke || "#e8c778") }} />;
  }
  if (item.kind === "shape") {
    const fill = item.defaults.fill === "transparent" ? "transparent" : String(item.defaults.fill || "#1a1510");
    return (
      <span
        className="ns-comp__shape"
        style={{
          background: fill,
          borderRadius: Number(item.defaults.radius) || 4,
          border: item.defaults.stroke ? `2px solid ${String(item.defaults.stroke)}` : undefined,
        }}
      />
    );
  }
  return (
    <ComponentIcon
      name={String(item.defaults.icon || "sparkle")}
      stroke={String(item.defaults.stroke || "#c9a45a")}
      strokeWidth={Number(item.defaults.strokeWidth) || 1.5}
      size={44}
    />
  );
}
