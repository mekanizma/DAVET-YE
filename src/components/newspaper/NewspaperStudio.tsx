"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import TimesReader from "@/components/TimesReader";
import IbanCheckout, { type PlacedOrder } from "@/components/checkout/IbanCheckout";
import { useCatalog } from "@/components/CatalogProvider";
import { SlotControl } from "@/components/newspaper/SlotControls";
import { applyNewspaper } from "@/lib/catalog";
import { getNewspaper, newspaperStyles, newspapers } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { editorLabel } from "@/i18n/editorLabel";
import { lp, withLocaleQuery } from "@/i18n/locale";
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
  legacyDraftToTimesValues,
  seedTimesValues,
} from "@/lib/timesFields";
import {
  applyTimesDraft,
  seedTimesContents,
  timesPageEditors,
} from "@/lib/timesPages";

type ToolId = "templates" | "pages" | "text" | "photos" | "order";
type PageId = string;

type Snap = Pick<NewspaperDraft, "template" | "values" | "contents" | "size" | "style">;
type EtsySessionInfo = { code: string; slug: string; title: string };

const TOOLS: { id: ToolId; label: string; icon: "sparkle" | "doc" | "type" | "image" | "wallet" | "download" }[] = [
  { id: "templates", label: "Şablonlar", icon: "sparkle" },
  { id: "pages", label: "Sayfalar", icon: "doc" },
  { id: "text", label: "Metin", icon: "type" },
  { id: "photos", label: "Fotoğraf", icon: "image" },
  { id: "order", label: "Sipariş", icon: "wallet" },
];

function snapOf(d: NewspaperDraft): Snap {
  return {
    template: d.template,
    values: { ...(d.values || {}) },
    contents: { ...(d.contents || {}) },
    size: d.size,
    style: d.style,
  };
}

const TOOL_EN: Record<ToolId, string> = {
  templates: "Templates",
  pages: "Pages",
  text: "Text",
  photos: "Photos",
  order: "Order",
};

export default function NewspaperStudio({
  initialTemplate,
  access,
}: {
  initialTemplate?: string;
  access?: EtsySessionInfo;
}) {
  const locale = useLocale();
  const en = locale === "en";
  const tx = useCallback((tr: string, english: string) => (locale === "en" ? english : tr), [locale]);
  const [saved, setSaved] = useLocalJson<NewspaperDraft>(NEWSPAPER_DRAFT, EMPTY_NEWSPAPER_DRAFT);
  const [etsy, setEtsy] = useState<EtsySessionInfo | null>(access ?? null);
  const start =
    initialTemplate && getNewspaper(initialTemplate)
      ? initialTemplate
      : etsy?.slug && getNewspaper(etsy.slug)
        ? etsy.slug
        : undefined;
  const appliedStart = useRef<string>("");
  const [bootSlug, setBootSlug] = useState<string | undefined>(
    initialTemplate && getNewspaper(initialTemplate) ? initialTemplate : undefined,
  );

  const draft = useMemo(() => {
    const n = normalizeNewspaperDraft(saved);
    if (bootSlug && n.template !== bootSlug) return { ...n, template: bootSlug };
    return n;
  }, [saved, bootSlug]);

  const cat = useCatalog();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payOpen, setPayOpen] = useState(false);
  const [page, setPage] = useState<PageId>(start ? "p:0" : "p:0");
  const [tool, setTool] = useState<ToolId>(start ? "text" : "templates");
  const [panelOpen, setPanelOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fitTick, setFitTick] = useState(0);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState("");
  const [design, setDesign] = useState<TimesReaderData | null>(null);
  const [designErr, setDesignErr] = useState("");
  const [designLoading, setDesignLoading] = useState(true);
  const seededFor = useRef<string>("");
  const past = useRef<Snap[]>([]);
  const future = useRef<Snap[]>([]);
  const skipHist = useRef(false);
  const [histTick, setHistTick] = useState(0);
  const canUndo = histTick >= 0 && past.current.length > 0;
  const canRedo = histTick >= 0 && future.current.length > 0;

  useEffect(() => {
    let stop = false;
    fetch("/api/etsy/oturum")
      .then((r) => r.json())
      .then((d) => {
        if (stop) return;
        if (!d?.ok) {
          setEtsy(null);
          if (access) window.location.assign(lp(locale, "/etsy"));
          return;
        }
        const info = { code: d.code as string, slug: d.slug as string, title: d.title as string };
        setEtsy(info);
        if (getNewspaper(info.slug)) setBootSlug(info.slug);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [access, locale]);

  const etsyMode = Boolean(etsy);
  const tools = useMemo(() => {
    const base = etsyMode ? TOOLS.filter((t) => t.id !== "templates") : TOOLS;
    if (!etsyMode) return base;
    return base.map((t) => (t.id === "order" ? { ...t, label: "İndir", icon: "download" as const } : t));
  }, [etsyMode]);

  const list = newspapers
    .map((n) => applyNewspaper(n, cat))
    .filter((n) => {
      if (etsy?.slug) return n.slug === etsy.slug;
      return !cat.newspapers[n.slug]?.hidden || n.slug === draft.template || n.slug === bootSlug;
    });
  const paperSource =
    list.find((n) => n.slug === draft.template) ||
    (bootSlug && list.find((n) => n.slug === bootSlug)) ||
    list[0] ||
    applyNewspaper(newspapers[0], cat);
  const paper = useMemo(() => localizeNewspaper(paperSource, locale), [paperSource, locale]);

  const pageEditors = useMemo(() => timesPageEditors(design), [design]);
  const values = useMemo(() => ({ ...legacyDraftToTimesValues(draft), ...(draft.values || {}) }), [draft]);
  const contents = useMemo(() => ({ ...(draft.contents || {}) }), [draft.contents]);
  const deferredValues = useDeferredValue(values);
  const deferredContents = useDeferredValue(contents);

  const previewData = useMemo(() => {
    if (!design) return null;
    return applyTimesDraft(design, { values: deferredValues, contents: deferredContents }, { embedded: true });
  }, [design, deferredValues, deferredContents]);

  const pages = useMemo(() => {
    return pageEditors.map((p, i) => ({
      id: `p:${p.index}` as PageId,
      no: String(i + 1).padStart(2, "0"),
      label: p.name,
      hint: en ? `${p.slots.length} ${p.slots.length === 1 ? "field" : "fields"}` : `${p.slots.length} alan`,
      slots: p.slots,
      index: p.index,
    }));
  }, [pageEditors, en]);

  const active = pages.find((p) => p.id === page) || pages[0];
  const textSlots = active?.slots.filter((s) => s.kind === "field" || s.kind === "content") || [];
  const photoSlots = active?.slots.filter((s) => s.kind === "image") || [];

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

  useEffect(() => {
    if (!start || !design) return;
    if (appliedStart.current === start) return;
    appliedStart.current = start;
    seededFor.current = start;
    const sameTemplate = saved.template === start;
    const reuseDraft = sameTemplate && (!access || saved.locale === locale);
    const keepValues = reuseDraft ? { ...(saved.values || {}) } : {};
    const keepContents = reuseDraft ? { ...(saved.contents || {}) } : {};
    setBootSlug(start);
    setSaved(
      normalizeNewspaperDraft({
        ...EMPTY_NEWSPAPER_DRAFT,
        ...(reuseDraft ? saved : {}),
        template: start,
        locale,
        values: { ...seedTimesValues(design), ...keepValues },
        contents: { ...seedTimesContents(design), ...keepContents },
        updatedAt: new Date().toISOString(),
      }),
    );
    past.current = [];
    future.current = [];
    setHistTick((n) => n + 1);
    setPage("p:0");
    setTool("text");
    setPayOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, design]);

  useEffect(() => {
    if (!design) return;
    if (start && appliedStart.current !== start) return;
    if (seededFor.current === paper.slug) return;
    seededFor.current = paper.slug;
    const hasUser = Object.keys(draft.values || {}).length > 0 || Object.keys(draft.contents || {}).length > 0;
    const draftMatchesLocale = !access || draft.locale === locale;
    if (hasUser && draft.template === paper.slug && draftMatchesLocale) return;
    setSaved(
      normalizeNewspaperDraft({
        ...draft,
        template: paper.slug,
        locale,
        values: {
          ...seedTimesValues(design),
          ...(draftMatchesLocale ? { ...legacyDraftToTimesValues(draft), ...(draft.values || {}) } : {}),
        },
        contents: { ...seedTimesContents(design), ...(draftMatchesLocale ? draft.contents || {} : {}) },
        updatedAt: new Date().toISOString(),
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, paper.slug]);

  useEffect(() => {
    if (!pages.length) return;
    if (pages.some((p) => p.id === page)) return;
    if (designLoading || !design) return;
    setPage(pages[0]!.id);
  }, [pages, page, designLoading, design]);

  useEffect(() => {
    setStatus("saved");
    const t = window.setTimeout(() => setStatus("idle"), 1200);
    return () => window.clearTimeout(t);
  }, [saved.updatedAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    if (!fitTick) return;
    setZoom(1);
  }, [fitTick]);

  function pushHistory() {
    if (skipHist.current) {
      skipHist.current = false;
      return;
    }
    past.current = [...past.current.slice(-24), snapOf(draft)];
    future.current = [];
    setHistTick((n) => n + 1);
  }

  function patch(p: Partial<NewspaperDraft>) {
    pushHistory();
    setSaved(normalizeNewspaperDraft({ ...draft, ...p, updatedAt: new Date().toISOString() }));
  }

  function applySnap(s: Snap) {
    skipHist.current = true;
    setBootSlug(undefined);
    setSaved(
      normalizeNewspaperDraft({
        ...draft,
        ...s,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  function undo() {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(snapOf(draft));
    applySnap(prev);
    setHistTick((n) => n + 1);
  }

  function redo() {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(snapOf(draft));
    applySnap(next);
    setHistTick((n) => n + 1);
  }

  function setValue(id: string, value: string) {
    patch({ values: { ...values, [id]: value } });
  }

  function setContent(id: string, value: string) {
    patch({ contents: { ...contents, [id]: value } });
  }

  function chooseTemplate(slug: string) {
    if (etsy && slug !== etsy.slug) return;
    if (!design && slug !== paper.slug) {
      seededFor.current = "";
    }
    seededFor.current = "";
    setBootSlug(undefined);
    past.current = [];
    future.current = [];
    setHistTick((n) => n + 1);
    setSaved(
      normalizeNewspaperDraft({
        ...draft,
        template: slug,
        values: {},
        contents: {},
        updatedAt: new Date().toISOString(),
      }),
    );
    setPage("p:0");
    setTool("text");
  }

  function validate() {
    const e: Record<string, string> = {};
    for (const editor of pageEditors) {
      for (const slot of editor.slots) {
        if (slot.kind === "field" && slot.field.required) {
          if (!(values[slot.field.id] || "").trim()) e[slot.field.id] = en ? `${editorLabel(slot.field.label, locale)} is required.` : `${slot.field.label} gerekli.`;
        }
        if (slot.kind === "image" && slot.required) {
          if (!(values[slot.fieldId] || "").trim()) e[slot.fieldId] = en ? `${editorLabel(slot.label, locale)} is required.` : `${slot.label} gerekli.`;
        }
      }
    }
    setErrors(e);
    if (Object.keys(e).length) {
      const hit = pageEditors.find((ed) =>
        ed.slots.some((s) => (s.kind === "field" && e[s.field.id]) || (s.kind === "image" && e[s.fieldId])),
      );
      if (hit) {
        setPage(`p:${hit.index}`);
        setTool("text");
      }
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

  function openTool(id: ToolId) {
    if (tool === id && panelOpen) {
      setPanelOpen(false);
      return;
    }
    setTool(id);
    setPanelOpen(true);
    if (id === "order") setInspectorOpen(false);
  }

  const titleLine = displayTitleFromValues(values, paper.title);
  const exitHref = etsyMode ? lp(locale, "/etsy") : lp(locale, `/gazeteler/${paper.slug}`);
  const panelTitle =
    tool === "templates"
      ? tx("Hazır gazeteler", "Ready-made newspapers")
      : tool === "pages"
        ? tx("Sayfalar", "Pages")
        : tool === "text"
          ? tx("Metin alanları", "Text fields")
          : tool === "photos"
            ? tx("Fotoğraflar", "Photos")
            : etsyMode
              ? tx("İndir / Yazdır", "Download / Print")
              : tx("Sipariş", "Order");

  return (
    <div className="ns-page">
      <div
        className="ns-app"
        data-panel-open={panelOpen ? "1" : "0"}
        data-inspector-open={inspectorOpen ? "1" : "0"}
        data-layout="desktop"
        data-etsy={etsyMode ? "1" : "0"}
      >
        <header className="ns-top">
          <Link href={exitHref} className="ns-top__exit" aria-label={tx("Gazete stüdyosundan çık", "Leave the newspaper studio")}>
            <Icon name="chevron-left" size={16} />
            <span className="ns-desktop-only">{tx("Çıkış", "Exit")}</span>
          </Link>

          <div className="ns-top__doc">
            <input
              className="ns-top__title"
              value={paper.title}
              readOnly
              aria-label={tx("Gazete adı", "Newspaper name")}
              title={paper.title}
            />
            <span className="ns-status" role="status" data-state={status}>
              {status === "saved" ? tx("Kaydedildi", "Saved") : tx("Taslak", "Draft")}
            </span>
          </div>

          <div className="ns-top__group" role="group" aria-label={tx("Düzenleme", "Editing")}>
            <button type="button" className="ns-iconbtn" aria-label={tx("Geri al", "Undo")} title={tx("Geri al (Ctrl+Z)", "Undo (Ctrl+Z)")} disabled={!canUndo} onClick={undo}>
              <Icon name="chevron-left" size={18} />
            </button>
            <button type="button" className="ns-iconbtn" aria-label={tx("Yinele", "Redo")} title={tx("Yinele (Ctrl+Y)", "Redo (Ctrl+Y)")} disabled={!canRedo} onClick={redo}>
              <Icon name="chevron-right" size={18} />
            </button>
          </div>

          <div className="ns-top__group ns-desktop-only" role="group" aria-label={tx("Yakınlaştırma", "Zoom")}>
            <button type="button" className="ns-iconbtn" aria-label={tx("Uzaklaştır", "Zoom out")} onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}>
              <Icon name="minus" size={16} />
            </button>
            <button type="button" className="ns-zoom__value" aria-label={tx(`Yakınlaştırma %${Math.round(zoom * 100)}`, `Zoom ${Math.round(zoom * 100)}%`)} onClick={() => setZoom(1)}>
              %{Math.round(zoom * 100)}
            </button>
            <button type="button" className="ns-iconbtn" aria-label={tx("Yakınlaştır", "Zoom in")} onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}>
              <Icon name="plus" size={16} />
            </button>
            <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => setFitTick((n) => n + 1)}>
              {tx("Sığdır", "Fit")}
            </button>
          </div>

          <button
            type="button"
            className="ns-chip ns-desktop-only"
            onClick={() => patch({ size: draft.size === "A3" ? "A2" : "A3" })}
            aria-label={tx(`Baskı boyutu: ${draft.size}`, `Print size: ${draft.size}`)}
          >
            {draft.size} {tx("baskı", "print")}
          </button>

          <div className="ns-top__end">
            <Link href={withLocaleQuery(locale, `/times/sablon/${paper.slug}`)} className="ns-btn ns-btn--ghost ns-btn--sm" target="_blank" rel="noopener noreferrer">
              <Icon name="expand" size={14} />
              <span className="ns-desktop-only">{tx("Önizle", "Preview")}</span>
            </Link>
            {etsyMode ? (
              <Link
                href={`${lp(locale, "/etsy/yazdir")}?sablon=${encodeURIComponent(paper.slug)}`}
                className="ns-btn ns-btn--primary"
              >
                <Icon name="download" size={14} />
                {tx("İndir", "Download")}
              </Link>
            ) : (
              <button
                type="button"
                className="ns-btn ns-btn--primary"
                onClick={() => {
                  openTool("order");
                  if (!payOpen && !draft.orderCode && validate()) setPayOpen(true);
                  else setPayOpen(true);
                }}
              >
                <Icon name="download" size={14} />
                {tx("Sipariş", "Order")}
              </button>
            )}
          </div>
        </header>

        <div className="ns-body">
          <nav className="ns-rail" aria-label={tx("Gazete araçları", "Newspaper tools")}>
            {tools.map((t) => (
              <button
                key={t.id}
                type="button"
                className="ns-rail__btn"
                aria-pressed={tool === t.id && panelOpen}
                onClick={() => openTool(t.id)}
              >
                <Icon name={t.icon} size={22} />
                {en ? (t.id === "order" && etsyMode ? "Download" : TOOL_EN[t.id]) : t.label}
              </button>
            ))}
          </nav>

          <section className="ns-panelhost" id="ns-panel" aria-labelledby="ns-panel-title">
            <header className="ns-panelhost__head">
              <h2 className="ns-panelhost__title" id="ns-panel-title">
                {panelTitle}
              </h2>
              <button type="button" className="ns-iconbtn" aria-label={tx("Paneli kapat", "Close the panel")} onClick={() => setPanelOpen(false)}>
                <Icon name="close" size={16} />
              </button>
            </header>
            <div className="ns-panelhost__body">
              {tool === "templates" ? (
                <>
                  <p className="ns-hint">{tx("Bir gazete seçin; kapak, hikâye, kareler ve teşekkür alanları otomatik gelir.", "Choose a newspaper; the cover, story, frames and thank-you fields are filled in for you.")}</p>
                  <div className="ns-tgrid" role="list">
                    {list.map((n) => {
                      const view = localizeNewspaper(n, locale);
                      return (
                      <button
                        key={n.slug}
                        type="button"
                        className={`ns-tcard${n.slug === paper.slug ? " is-on" : ""}`}
                        onClick={() => chooseTemplate(n.slug)}
                      >
                        <span className="ns-tcard__thumb">
                          {view.cover ? (
                            <Image src={view.cover} alt="" width={160} height={220} sizes="(max-width: 720px) 42vw, 140px" />
                          ) : (
                            <span className="ns-tcard__ph" style={{ background: n.paper, color: n.ink }}>
                              {view.headline.slice(0, 1)}
                            </span>
                          )}
                        </span>
                        <span className="ns-tcard__name">{view.title}</span>
                      </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {tool === "pages" ? (
                <>
                  <p className="ns-hint">{tx("Düzenlemek istediğiniz gazete sayfasını seçin.", "Choose the newspaper page you want to edit.")}</p>
                  <div className="ns-pagelist">
                    {pages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={p.id === active?.id ? "is-on" : undefined}
                        onClick={() => {
                          setPage(p.id);
                          setTool("text");
                          setInspectorOpen(true);
                        }}
                      >
                        <span className="ns-pagelist__no">{p.no}</span>
                        <span>
                          <strong>{p.label}</strong>
                          <small>{p.hint}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {tool === "text" ? (
                <>
                  <p className="ns-hint">
                    {active ? `${active.no} · ${active.label}` : tx("Sayfa yükleniyor…", "The page is loading…")} — {tx("metinler canlı gazeteye yazılır.", "text is written onto the live newspaper.")}
                  </p>
                  {designLoading ? <p className="ns-hint">{tx("Alanlar yükleniyor…", "Fields are loading…")}</p> : null}
                  {designErr ? (
                    <p className="field__error" role="alert">
                      {designErr}
                    </p>
                  ) : null}
                  <div className="ns-fields">
                    {textSlots.map((slot) => (
                      <SlotControl
                        key={`${slot.kind}-${slot.id}`}
                        slot={slot}
                        value={
                          slot.kind === "content"
                            ? contents[slot.id] ?? slot.text
                            : slot.kind === "field"
                              ? values[slot.field.id] || ""
                              : ""
                        }
                        error={slot.kind === "field" ? errors[slot.field.id] : undefined}
                        onChange={(v) => {
                          if (slot.kind === "content") setContent(slot.id, v);
                          else if (slot.kind === "field") setValue(slot.field.id, v);
                        }}
                        onImage={() => undefined}
                        onClearImage={() => undefined}
                      />
                    ))}
                    {!designLoading && !textSlots.length ? <p className="ns-hint">{tx("Bu sayfada metin alanı yok.", "This page has no text fields.")}</p> : null}
                  </div>
                </>
              ) : null}

              {tool === "photos" ? (
                <>
                  <p className="ns-hint">{tx("Sayfa fotoğraflarını yükleyin; önizleme anında güncellenir.", "Upload the page photos; the preview updates straight away.")}</p>
                  {photoErr ? (
                    <p className="field__error" role="alert">
                      {photoErr}
                    </p>
                  ) : null}
                  <div className="ns-fields">
                    {photoSlots.map((slot) =>
                      slot.kind === "image" ? (
                        <SlotControl
                          key={`img-${slot.fieldId}`}
                          slot={slot}
                          value={values[slot.fieldId] || ""}
                          error={errors[slot.fieldId]}
                          busy={photoBusy === slot.fieldId}
                          onChange={() => undefined}
                          onImage={(file) => void onImage(slot.fieldId, file)}
                          onClearImage={() => setValue(slot.fieldId, "")}
                        />
                      ) : null,
                    )}
                    {!photoSlots.length ? <p className="ns-hint">{tx("Bu sayfada fotoğraf alanı yok. Başka sayfa seçin.", "This page has no photo fields. Choose another page.")}</p> : null}
                  </div>
                </>
              ) : null}

              {tool === "order" ? (
                <>
                  <div className="ns-recap">
                    <strong>{paper.title}</strong>
                    <span>{titleLine || "—"}</span>
                    <span className="field__hint">
                      {values.weddingDate || values.eventDate || draft.date || tx("Tarih yok", "No date")} · {values.venue || tx("Mekân yok", "No venue")} ·{" "}
                      {draft.size}
                    </span>
                  </div>
                  <div className="ns-fields" style={{ marginBottom: 12 }}>
                    <label className="field">
                      <span className="field__label">{tx("Baskı boyutu", "Print size")}</span>
                      <select className="input" value={draft.size} onChange={(e) => patch({ size: e.target.value as "A3" | "A2" })}>
                        <option value="A3">A3</option>
                        <option value="A2">A2</option>
                      </select>
                    </label>
                    <label className="field">
                      <span className="field__label">{tx("Kâğıt görünümü", "Paper look")}</span>
                      <select
                        className="input"
                        value={draft.style}
                        onChange={(e) => patch({ style: e.target.value as NewspaperDraft["style"] })}
                      >
                        {newspaperStyles(locale).map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {etsyMode ? (
                    <>
                      <p className="ns-hint">
                        {tx(
                          `Etsy kodunuz aktif (${etsy?.code}). Havale gerekmez — tasarımı bitirip indirebilirsiniz.`,
                          `Your Etsy code is active (${etsy?.code}). No bank transfer — finish the design and download.`,
                        )}
                      </p>
                      <Link
                        href={`${lp(locale, "/etsy/yazdir")}?sablon=${encodeURIComponent(paper.slug)}`}
                        className="ns-btn ns-btn--primary ns-btn--block"
                      >
                        <Icon name="download" size={16} />
                        {tx("Yazdır / PDF kaydet", "Print / Save PDF")}
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="ns-hint">{tx("Taslak tarayıcıda saklanır. Ödeme havale / EFT ile alınır.", "The draft is saved in this browser. Payment is by bank transfer.")}</p>
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
                          resume={draft.orderCode && draft.orderEmail ? { code: draft.orderCode, email: draft.orderEmail } : null}
                          onUpdate={remember}
                        />
                      ) : (
                        <button
                          type="button"
                          className="ns-btn ns-btn--primary ns-btn--block"
                          onClick={() => {
                            if (validate()) setPayOpen(true);
                          }}
                        >
                          {tx("Havale ile devam et", "Continue with bank transfer")}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : null}
            </div>
          </section>

          <main className="ns-center" aria-label={tx("Gazete tasarım alanı", "Newspaper canvas")}>
            <div className="ns-canvas" style={{ transform: `scale(${zoom})` }}>
              <div className="ns-canvas__stage">
                {previewData ? (
                  <TimesReader key={paper.slug} data={previewData} slug={paper.slug} embedded />
                ) : (
                  <div className="ns-canvas__empty">{designLoading ? tx("Gazete yükleniyor…", "The newspaper is loading…") : tx("Şablon bulunamadı", "Template not found")}</div>
                )}
              </div>
            </div>
            <div className="ns-fab">
              <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => setInspectorOpen((v) => !v)}>
                <Icon name="sliders" size={14} /> {tx("Düzenle", "Edit")}
              </button>
            </div>
          </main>

          <aside className="ns-inspector" aria-label={tx("Düzenle", "Edit")}>
            <header className="ns-inspector__head">
              <h2>{active ? active.label : tx("Gazete", "Newspaper")}</h2>
              <p>
                {draft.size} · {paper.title}
                {active ? ` · ${active.slots.length} ${en ? (active.slots.length === 1 ? "field" : "fields") : "alan"}` : ""}
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => openTool("text")}>
                  {tx("Metin", "Text")}
                </button>
                <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => openTool("photos")}>
                  {tx("Fotoğraf", "Photo")}
                </button>
                <button
                  type="button"
                  className="ns-btn ns-btn--ghost ns-btn--sm"
                  onClick={() => {
                    const i = pages.findIndex((p) => p.id === active?.id);
                    if (i >= 0 && i < pages.length - 1) setPage(pages[i + 1]!.id);
                  }}
                >
                  {tx("Sonraki sayfa", "Next page")}
                </button>
              </div>
            </header>
            <div className="ns-inspector__body">
              <p className="ns-hint">{tx("Seçili sayfadaki alanlar. Değişiklikler ortadaki gazeteye anında yansır.", "Fields on the selected page. Changes appear on the newspaper straight away.")}</p>
              {photoErr ? (
                <p className="field__error" role="alert">
                  {photoErr}
                </p>
              ) : null}
              <div className="ns-fields">
                {(active?.slots || []).map((slot) => (
                  <SlotControl
                    key={`ins-${slot.kind}-${slot.id}`}
                    slot={slot}
                    value={
                      slot.kind === "content"
                        ? contents[slot.id] ?? slot.text
                        : slot.kind === "field"
                          ? values[slot.field.id] || ""
                          : values[slot.fieldId] || ""
                    }
                    error={
                      slot.kind === "field" ? errors[slot.field.id] : slot.kind === "image" ? errors[slot.fieldId] : undefined
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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
