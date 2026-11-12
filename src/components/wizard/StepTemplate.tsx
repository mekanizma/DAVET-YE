"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "../Icon";
import { useCatalog } from "@/components/CatalogProvider";
import { applyTheme } from "@/lib/catalog";
import { coverOf, EVENT_LABELS, themes } from "@/data/themes";
import { foldTr, formatTL } from "@/lib/format";
import { saveDraft, type InvitationDraft } from "@/lib/storage";
import type { Errors } from "./validate";

const PAGE = 12;

export default function StepTemplate({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  const cat = useCatalog();
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const list = useMemo(() => {
    const f = foldTr(q.trim());
    return themes
      .map((t) => applyTheme(t, cat))
      .filter((t) => !cat.themes[t.slug]?.hidden || t.slug === draft.template)
      .filter((t) => {
        if (!all && draft.event && !t.eventTypes.includes(draft.event)) return false;
        return !f || foldTr(t.title).includes(f);
      });
  }, [q, all, draft.event, draft.template, cat]);

  const ordered = useMemo(() => {
    if (!draft.template) return list;
    const i = list.findIndex((t) => t.slug === draft.template);
    if (i <= 0) return list;
    const next = list.slice();
    const [picked] = next.splice(i, 1);
    next.unshift(picked);
    return next;
  }, [list, draft.template]);

  return (
    <fieldset className="wz-fieldset">
      <legend className="sr-only">Davetiye</legend>
      {draft.event && (
        <p className="tpl-event">
          <strong>{EVENT_LABELS[draft.event]}</strong>
          <Link href="/tr/davetiye-olustur/etkinlik">Değiştir</Link>
        </p>
      )}

      <div className="wz-tools">
        <div className="field wz-tools__search">
          <label className="field__label" htmlFor="wz-q">Davetiye ara</label>
          <input id="wz-q" type="search" className="input" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Örn. Güz Masalı" />
        </div>
        <label className="check wz-tools__all">
          <input type="checkbox" checked={all} onChange={(e) => { setAll(e.target.checked); setLimit(PAGE); }} />
          <span>Tüm etkinlik türlerini göster</span>
        </label>
      </div>

      <p className="wz-count" role="status">{ordered.length} davetiye</p>

      {ordered.length === 0 ? (
        <div className="empty">
          <p>“{q}” için sonuç bulunamadı.</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => { setQ(""); setAll(true); }}>Filtreleri temizle</button>
        </div>
      ) : (
        <div className="tpl-grid" role="radiogroup" aria-describedby={errors.template ? "tpl-e" : undefined}>
          {ordered.slice(0, limit).map((t) => {
            const on = draft.template === t.slug;
            return (
              <div key={t.slug} className={`tpl${on ? " is-on" : ""}`}>
                <label className="tpl__pick">
                  <input
                    type="radio"
                    name="tpl"
                    value={t.slug}
                    checked={on}
                    onChange={() => saveDraft({ template: t.slug, order: draft.template === t.slug ? draft.order : null })}
                  />
                  <span className="tpl__img">
                    <Image src={coverOf(t)} alt="" width={240} height={400} sizes="(max-width: 600px) 44vw, 180px" />
                    <span className="tpl__tick" aria-hidden="true"><Icon name="check" size={14} /></span>
                  </span>
                  <span className="tpl__name">{t.title}</span>
                  <span className="tpl__price num">
                    {t.compareAt > t.price && <s>{formatTL(t.compareAt)}</s>}
                    {formatTL(t.price)}
                  </span>
                  <span className="tpl__select">{on ? "Seçildi" : "Seç"}</span>
                </label>
                <a className="tpl__prev" href={`/onizleme/tema/${t.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`${t.title} önizleme (yeni sekme)`}>
                  <Icon name="expand" size={12} /> Önizle
                </a>
              </div>
            );
          })}
        </div>
      )}

      {ordered.length > limit && (
        <div className="wz-more">
          <button type="button" className="btn btn--outline" onClick={() => setLimit((l) => l + PAGE)}>
            Daha fazla göster ({ordered.length - limit})
          </button>
        </div>
      )}
      {errors.template && <p id="tpl-e" className="field__error" role="alert">{errors.template}</p>}
    </fieldset>
  );
}
