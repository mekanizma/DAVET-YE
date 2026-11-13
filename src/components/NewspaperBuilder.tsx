"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import { TextAreaField, TextField } from "./Field";
import TimesReader from "./TimesReader";
import IbanCheckout, { type PlacedOrder } from "./checkout/IbanCheckout";
import { useCatalog } from "@/components/CatalogProvider";
import { applyNewspaper } from "@/lib/catalog";
import { getNewspaper, newspaperStyles, newspapers } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { suggestShareSlug } from "@/lib/shareSlug";
import { withLocaleQuery } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";
import {
  EMPTY_NEWSPAPER_DRAFT,
  fileToDraftPhoto,
  normalizeNewspaperDraft,
} from "@/lib/newspaperDraft";
import {
  getLocalJson,
  NEWSPAPER_DRAFT,
  setLocalJson,
  useLocalJson,
  type NewspaperDraft,
  type StoredOrder,
} from "@/lib/storage";
import type { TimesReaderData } from "@/lib/times";
import {
  displayTitleFromValues,
  fromIsoDate,
  fromIsoTime,
  legacyDraftToTimesValues,
  seedTimesValues,
  toIsoLocal,
  type TimesFieldDef,
} from "@/lib/timesFields";
import {
  applyTimesDraft,
  seedTimesContents,
  timesPageEditors,
  type TimesPageSlot,
} from "@/lib/timesPages";

type PageId = string;

export default function NewspaperBuilder({ initialTemplate }: { initialTemplate?: string }) {
  const locale = useLocale();
  const en = locale === "en";
  const tx = useCallback((tr: string, english: string) => (locale === "en" ? english : tr), [locale]);
  const [saved, setSaved] = useLocalJson<NewspaperDraft>(NEWSPAPER_DRAFT, EMPTY_NEWSPAPER_DRAFT);
  /** "Bu Gazeteyle Başla" → ?sablon= applied once on entry (over stale draft) */
  const start = initialTemplate && getNewspaper(initialTemplate) ? initialTemplate : undefined;
  const appliedStart = useRef<string>("");
  const [bootSlug, setBootSlug] = useState<string | undefined>(start);

  const draft = useMemo(() => {
    const n = normalizeNewspaperDraft(saved);
    if (bootSlug && n.template !== bootSlug) return { ...n, template: bootSlug };
    return n;
  }, [saved, bootSlug]);

  const cat = useCatalog();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payOpen, setPayOpen] = useState(false);
  const [page, setPage] = useState<PageId>(start ? "p:0" : "baski");
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState("");
  const [design, setDesign] = useState<TimesReaderData | null>(null);
  const [designErr, setDesignErr] = useState("");
  const [designLoading, setDesignLoading] = useState(true);
  const seededFor = useRef<string>("");

  const list = newspapers
    .map((n) => applyNewspaper(n, cat))
    .filter((n) => !cat.newspapers[n.slug]?.hidden || n.slug === draft.template || n.slug === bootSlug);
  const paperSource =
    list.find((n) => n.slug === draft.template) ||
    (bootSlug && list.find((n) => n.slug === bootSlug)) ||
    list[0] ||
    applyNewspaper(newspapers[0], cat);
  const paper = useMemo(() => localizeNewspaper(paperSource, locale), [paperSource, locale]);

  const pageEditors = useMemo(() => timesPageEditors(design), [design]);

  const values = useMemo(() => {
    return { ...legacyDraftToTimesValues(draft), ...(draft.values || {}) };
  }, [draft]);

  const contents = useMemo(() => ({ ...(draft.contents || {}) }), [draft.contents]);
  const deferredValues = useDeferredValue(values);
  const deferredContents = useDeferredValue(contents);

  const previewData = useMemo(() => {
    if (!design) return null;
    return applyTimesDraft(
      design,
      { values: deferredValues, contents: deferredContents },
      { embedded: true },
    );
  }, [design, deferredValues, deferredContents]);

  const pages = useMemo(() => {
    const items: { id: PageId; no: string; label: string; hint: string }[] = [
      { id: "baski", no: "", label: tx("Şablon", "Template"), hint: tx("Gazete seç", "Choose a newspaper") },
    ];
    pageEditors.forEach((p, i) => {
      items.push({
        id: `p:${p.index}`,
        no: String(i + 1).padStart(2, "0"),
        label: p.name,
        hint: en ? `${p.slots.length} ${p.slots.length === 1 ? "field" : "fields"}` : `${p.slots.length} alan`,
      });
    });
    items.push({ id: "siparis", no: "", label: tx("Sipariş", "Order"), hint: tx("Ödeme", "Payment") });
    return items;
  }, [pageEditors, en, tx]);

  useEffect(() => {
    let cancelled = false;
    setDesignLoading(true);
    setDesignErr("");
    fetch(`/api/times/${encodeURIComponent(paper.slug)}${locale === "en" ? "?dil=en" : ""}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(tx("Şablon yüklenemedi", "The template could not be loaded"));
        return (await r.json()) as TimesReaderData;
      })
      .then((data) => {
        if (cancelled) return;
        setDesign(data);
        setDesignLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setDesign(null);
        setDesignLoading(false);
        setDesignErr(err instanceof Error ? err.message : tx("Şablon yüklenemedi", "The template could not be loaded"));
      });
    return () => {
      cancelled = true;
    };
  }, [paper.slug, locale, tx]);

  // Coming from gazeteler "Bu Gazeteyle Başla" → open that newspaper immediately
  useEffect(() => {
    if (!start || !design) return;
    if (appliedStart.current === start) return;
    appliedStart.current = start;
    seededFor.current = start;
    const sameTemplate = saved.template === start;
    const keepValues = sameTemplate ? { ...(saved.values || {}) } : {};
    const keepContents = sameTemplate ? { ...(saved.contents || {}) } : {};
    setBootSlug(start);
    setSaved(
      normalizeNewspaperDraft({
        ...EMPTY_NEWSPAPER_DRAFT,
        ...saved,
        template: start,
        values: { ...seedTimesValues(design), ...keepValues },
        contents: { ...seedTimesContents(design), ...keepContents },
        updatedAt: new Date().toISOString(),
      }),
    );
    setPage("p:0");
    setPayOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, design]);

  useEffect(() => {
    if (!design) return;
    if (start && appliedStart.current !== start) return; // wait for URL boot
    if (seededFor.current === paper.slug) return;
    seededFor.current = paper.slug;
    const hasUser =
      Object.keys(draft.values || {}).length > 0 || Object.keys(draft.contents || {}).length > 0;
    if (hasUser && draft.template === paper.slug) return;
    patch({
      template: paper.slug,
      values: { ...seedTimesValues(design), ...legacyDraftToTimesValues(draft), ...(draft.values || {}) },
      contents: { ...seedTimesContents(design), ...(draft.contents || {}) },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, paper.slug]);

  useEffect(() => {
    if (page === "baski" || page === "siparis") return;
    if (pages.some((p) => p.id === page)) return;
    // Design henüz gelmediyse p:0 beklemeye devam et (şablon picker'a düşme)
    if (designLoading || !design) return;
    setPage(pages.find((p) => p.id === "p:0")?.id || pages[1]?.id || "baski");
  }, [pages, page, designLoading, design]);

  function patch(p: Partial<NewspaperDraft>) {
    setSaved(normalizeNewspaperDraft({ ...draft, ...p, updatedAt: new Date().toISOString() }));
  }

  function setValue(id: string, value: string) {
    patch({ values: { ...values, [id]: value } });
  }

  function setContent(id: string, value: string) {
    patch({ contents: { ...contents, [id]: value } });
  }

  function validate() {
    const e: Record<string, string> = {};
    for (const editor of pageEditors) {
      for (const slot of editor.slots) {
        if (slot.kind === "field" && slot.field.required) {
          if (!(values[slot.field.id] || "").trim()) e[slot.field.id] = en ? `${slot.field.label} is required.` : `${slot.field.label} gerekli.`;
        }
        if (slot.kind === "image" && slot.required) {
          if (!(values[slot.fieldId] || "").trim()) e[slot.fieldId] = en ? `${slot.label} is required.` : `${slot.label} gerekli.`;
        }
      }
    }
    setErrors(e);
    if (Object.keys(e).length) {
      const hit = pageEditors.find((ed) =>
        ed.slots.some((s) => (s.kind === "field" && e[s.field.id]) || (s.kind === "image" && e[s.fieldId])),
      );
      if (hit) setPage(`p:${hit.index}`);
    }
    return Object.keys(e).length === 0;
  }

  function remember(order: PlacedOrder) {
    patch({ orderCode: order.code, orderEmail: order.email });
    const prev = getLocalJson<StoredOrder[]>("orders", []);
    const row: StoredOrder = {
      code: order.code,
      at: order.at,
      total: order.total,
      template: paper.slug,
      title: paper.title,
      status: order.status,
      kind: "gazete",
      email: order.email,
    };
    setLocalJson("orders", [row, ...prev.filter((x) => x.code !== order.code)]);
  }

  async function onImage(fieldId: string, file: File | null) {
    setPhotoErr("");
    if (!file) return;
    setPhotoBusy(fieldId);
    try {
      const url = await fileToDraftPhoto(file);
      const next = { ...values, [fieldId]: url };
      if (fieldId === "coverPhoto") {
        patch({ values: next, photos: { ...draft.photos, cover: url } });
      } else {
        patch({ values: next });
      }
    } catch (err) {
      setPhotoErr(err instanceof Error ? err.message : tx("Görsel yüklenemedi.", "The image could not be uploaded."));
    } finally {
      setPhotoBusy(null);
    }
  }

  const pageIndex = pages.findIndex((p) => p.id === page);
  const titleLine = displayTitleFromValues(values, paper.title);
  const activeEditor = page.startsWith("p:")
    ? pageEditors.find((p) => `p:${p.index}` === page)
    : undefined;

  return (
    <div className="nb nb--desk">
      <div className="nb__form nb-desk">
        <header className="nb-desk__head">
          <p className="nb-desk__kicker">{tx("Manşet stüdyosu", "Front-page studio")}</p>
          <h2 className="nb-desk__title">{paper.title}</h2>
          <p className="nb-desk__sub">{tx("Her gazete sayfasındaki metin, künye ve fotoğrafları değiştirin — canlı önizleme sağda.", "Edit the text, masthead and photos on every page — the live preview is on the right.")}</p>
        </header>

        <nav className="nb-pages" aria-label={tx("Gazete sayfaları", "Newspaper pages")}>
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`nb-pages__btn${page === p.id ? " is-on" : ""}`}
              onClick={() => setPage(p.id)}
            >
              {p.no ? <span className="nb-pages__no">{p.no}</span> : null}
              <span className="nb-pages__label">{p.label}</span>
              <span className="nb-pages__hint">{p.hint}</span>
            </button>
          ))}
        </nav>

        {page === "baski" && (
          <section className="nb-panel">
            <h3 className="nb-panel__h">{tx("Gazete şablonu", "Newspaper template")}</h3>
            <p className="nb-panel__lede">{tx("Şablon seçince tüm sayfa alanları (kapak, hikâye, kareler, teşekkür) buraya gelir.", "Choosing a template brings in every page field: cover, story, frames and thanks.")}</p>
            <div className="nb-tpls" role="radiogroup" aria-label={tx("Gazete şablonları", "Newspaper templates")}>
              {list.map((n) => (
                <label key={n.slug} className={`nb-tpl${n.slug === paper.slug ? " is-on" : ""}`}>
                  <input
                    type="radio"
                    name="np"
                    checked={n.slug === paper.slug}
                    onChange={() => {
                      seededFor.current = "";
                      setBootSlug(undefined);
                      patch({ template: n.slug, values: {}, contents: {} });
                      setPage("baski");
                    }}
                  />
                  {localizeNewspaper(n, locale).cover ? (
                    <Image src={localizeNewspaper(n, locale).cover!} alt="" width={90} height={127} sizes="(max-width: 720px) 28vw, 90px" />
                  ) : (
                    <span className="nb-tpl__ph" style={{ background: n.paper, color: n.ink }} aria-hidden="true">
                      {n.headline.slice(0, 1)}
                    </span>
                  )}
                  <span>{localizeNewspaper(n, locale).title}</span>
                </label>
              ))}
            </div>
            <div className="field-row field-row--2" style={{ marginTop: 16 }}>
              <div className="field">
                <label className="field__label" htmlFor="np-size">
                  {tx("Baskı boyutu", "Print size")}
                </label>
                <select id="np-size" className="input" value={draft.size} onChange={(e) => patch({ size: e.target.value as "A3" | "A2" })}>
                  <option value="A3">A3</option>
                  <option value="A2">A2</option>
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="np-style">
                  {tx("Kâğıt görünümü", "Paper look")}
                </label>
                <select
                  id="np-style"
                  className="input"
                  value={draft.style}
                  onChange={(e) => patch({ style: e.target.value as NewspaperDraft["style"] })}
                >
                  {newspaperStyles(locale).map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {designLoading ? <p className="field__hint">{tx("Sayfa alanları yükleniyor…", "Page fields are loading…")}</p> : null}
            {designErr ? (
              <p className="field__error" role="alert">
                {designErr}
              </p>
            ) : null}
            {!designLoading && pageEditors.length ? (
              <p className="field__hint">
                {en
                  ? `${pageEditors.length} ${pageEditors.length === 1 ? "page" : "pages"} · ${pageEditors.reduce((n, p) => n + p.slots.length, 0)} editable fields`
                  : `${pageEditors.length} sayfa · ${pageEditors.reduce((n, p) => n + p.slots.length, 0)} düzenlenebilir alan`}
              </p>
            ) : null}
          </section>
        )}

        {activeEditor ? (
          <section className="nb-panel">
            <h3 className="nb-panel__h">
              {String(activeEditor.index + 1).padStart(2, "0")} · {activeEditor.name}
            </h3>
            <p className="nb-panel__lede">{tx("Bu sayfadaki manşet, metin ve fotoğraflar. Değişiklikler tüm gazeteye yansır.", "The headline, text and photos on this page. Changes apply to the whole newspaper.")}</p>
            {photoErr ? (
              <p className="field__error" role="alert">
                {photoErr}
              </p>
            ) : null}
            <div className="nb-fields">
              {activeEditor.slots.map((slot) => (
                <SlotControl
                  key={`${slot.kind}-${slot.id}`}
                  slot={slot}
                  value={
                    slot.kind === "content"
                      ? contents[slot.id] ?? slot.text
                      : slot.kind === "field"
                        ? values[slot.field.id] || ""
                        : values[slot.fieldId] || ""
                  }
                  error={
                    slot.kind === "field"
                      ? errors[slot.field.id]
                      : slot.kind === "image"
                        ? errors[slot.fieldId]
                        : undefined
                  }
                  busy={slot.kind === "image" ? photoBusy === slot.fieldId : false}
                  onChange={(v) => {
                    if (slot.kind === "content") setContent(slot.id, v);
                    else if (slot.kind === "field") setValue(slot.field.id, v);
                    else setValue(slot.fieldId, v);
                  }}
                  onImage={(file) => {
                    if (slot.kind === "image") void onImage(slot.fieldId, file);
                  }}
                  onClearImage={() => {
                    if (slot.kind === "image") setValue(slot.fieldId, "");
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        {page === "siparis" && (
          <section className="nb-panel">
            <h3 className="nb-panel__h">{tx("Sipariş", "Order")}</h3>
            <div className="nb-recap">
              <p>
                <strong>{paper.title}</strong>
              </p>
              <p>{titleLine || "—"}</p>
              <p className="field__hint">
                {values.weddingDate || values.eventDate || draft.date || tx("Tarih yok", "No date")} · {values.venue || tx("Mekân yok", "No venue")} ·{" "}
                {draft.size}
              </p>
            </div>
            <div className="nb__summary">
              <p className="field__hint">{tx("Taslak tarayıcıda saklanır. Ödeme havale / EFT ile alınır.", "The draft is saved in this browser. Payment is by bank transfer.")}</p>
              {payOpen || draft.orderCode ? (
                <IbanCheckout
                  kind="gazete"
                  template={paper.slug}
                  title={paper.title}
                  previewTotal={paper.price}
                  snapshot={{
                    [en ? "Names" : "İsimler"]: titleLine,
                    [en ? "Date" : "Tarih"]: values.weddingDate || values.eventDate || "",
                    [en ? "Venue" : "Mekan"]: values.venue || "",
                    [en ? "Size" : "Boyut"]: draft.size,
                    [en ? "Story" : "Hikaye"]: (values.story || "").slice(0, 280),
                  }}
                  shareSlug={suggestShareSlug(titleLine || paper.title)}
                  design={{ template: paper.slug, values, contents, size: draft.size, style: draft.style }}
                  resume={draft.orderCode && draft.orderEmail ? { code: draft.orderCode, email: draft.orderEmail } : null}
                  onUpdate={remember}
                />
              ) : (
                <button
                  type="button"
                  className="btn btn--dark btn--lg btn--block btn--serif"
                  onClick={() => {
                    if (validate()) setPayOpen(true);
                  }}
                >
                  {tx("Havale ile devam et", "Continue with bank transfer")}
                </button>
              )}
              <Link
                href={withLocaleQuery(locale, `/times/sablon/${paper.slug}`)}
                className="btn btn--outline btn--block"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="expand" size={14} /> {tx("Tam ekran gazete", "Full-screen newspaper")}
              </Link>
            </div>
          </section>
        )}

        <div className="nb-nav">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            disabled={pageIndex <= 0}
            onClick={() => setPage(pages[pageIndex - 1]!.id)}
          >
            {tx("Önceki", "Previous")}
          </button>
          <button
            type="button"
            className="btn btn--dark btn--sm"
            disabled={pageIndex >= pages.length - 1}
            onClick={() => setPage(pages[pageIndex + 1]!.id)}
          >
            {tx("Sonraki", "Next")}
          </button>
        </div>
      </div>

      <div className="nb__preview nb__preview--times" aria-label={tx("Gazete önizlemesi", "Newspaper preview")}>
        {previewData ? (
          <TimesReader key={paper.slug} data={previewData} slug={paper.slug} embedded />
        ) : (
          <div className="nb__preview-empty">{designLoading ? tx("Gazete yükleniyor…", "The newspaper is loading…") : tx("Şablon bulunamadı", "Template not found")}</div>
        )}
      </div>
    </div>
  );
}

function SlotControl({
  slot,
  value,
  error,
  busy,
  onChange,
  onImage,
  onClearImage,
}: {
  slot: TimesPageSlot;
  value: string;
  error?: string;
  busy?: boolean;
  onChange: (v: string) => void;
  onImage: (file: File | null) => void;
  onClearImage: () => void;
}) {
  const en = useLocale() === "en";
  if (slot.kind === "image") {
    return (
      <PhotoSlot
        label={slot.label + (slot.required ? " *" : "")}
        help={slot.help}
        src={value}
        busy={busy}
        onPick={onImage}
        onClear={onClearImage}
      />
    );
  }

  if (slot.kind === "content") {
    if (slot.multiline) {
      return (
        <TextAreaField
          id={`ct-${slot.id}`}
          label={slot.label}
          rows={3}
          value={value}
          maxLength={slot.maxLength}
          hint={en ? "Page text" : "Sayfa metni"}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    return (
      <TextField
        id={`ct-${slot.id}`}
        label={slot.label}
        value={value}
        maxLength={slot.maxLength}
        hint={en ? "Page text" : "Sayfa metni"}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return <FieldControl field={slot.field} value={value} error={error} onChange={onChange} />;
}

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: TimesFieldDef;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const en = useLocale() === "en";
  if (field.type === "dateTime" || field.type === "date") {
    const date = fromIsoDate(value);
    const time = fromIsoTime(value) || "19:00";
    return (
      <div className="nb-grid">
        <TextField
          id={`tf-${field.id}-d`}
          type="date"
          label={field.label}
          required={field.required}
          value={date}
          error={error}
          hint={field.help}
          onChange={(e) => onChange(toIsoLocal(e.target.value, time))}
        />
        {field.type === "dateTime" ? (
          <TextField
            id={`tf-${field.id}-t`}
            type="time"
            label={en ? "Time" : "Saat"}
            value={time}
            onChange={(e) => onChange(toIsoLocal(date || new Date().toISOString().slice(0, 10), e.target.value))}
          />
        ) : null}
      </div>
    );
  }

  if (field.type === "longText") {
    return (
      <TextAreaField
        id={`tf-${field.id}`}
        label={field.label}
        required={field.required}
        rows={5}
        value={value}
        error={error}
        hint={field.help || (field.maxLength ? `${value.length}/${field.maxLength}` : undefined)}
        maxLength={field.maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <TextField
      id={`tf-${field.id}`}
      label={field.label}
      required={field.required}
      value={value}
      error={error}
      hint={field.help}
      maxLength={field.maxLength}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function PhotoSlot({
  label,
  help,
  src,
  busy,
  onPick,
  onClear,
}: {
  label: string;
  help?: string;
  src: string;
  busy?: boolean;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const en = useLocale() === "en";
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`nb-photo${src ? " has-img" : ""}`}>
      <div className="nb-photo__frame">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" />
        ) : (
          <span className="nb-photo__empty">
            <Icon name="upload" size={20} />
            {busy ? (en ? "Loading…" : "Yükleniyor…") : en ? "Add a photo" : "Fotoğraf ekle"}
          </span>
        )}
      </div>
      <div className="nb-photo__meta">
        <span className="nb-photo__label">{label}</span>
        {help ? <span className="field__hint">{help}</span> : null}
        <div className="nb-photo__actions">
          <button type="button" className="btn btn--outline btn--xs" disabled={busy} onClick={() => inputRef.current?.click()}>
            {src ? (en ? "Change" : "Değiştir") : en ? "Upload" : "Yükle"}
          </button>
          {src ? (
            <button type="button" className="btn btn--ghost btn--xs" onClick={onClear} aria-label={en ? `Remove ${label}` : `${label} kaldır`}>
              <Icon name="trash" size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          e.target.value = "";
          onPick(f);
        }}
      />
    </div>
  );
}
