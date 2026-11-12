"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import TimesReader from "@/components/TimesReader";
import IbanCheckout, { type PlacedOrder } from "@/components/checkout/IbanCheckout";
import { useCatalog } from "@/components/CatalogProvider";
import { SlotControl } from "@/components/newspaper/SlotControls";
import { applyNewspaper } from "@/lib/catalog";
import { getNewspaper, newspapers } from "@/data/newspapers";
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

const TOOLS: { id: ToolId; label: string; icon: "sparkle" | "doc" | "type" | "image" | "wallet" }[] = [
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

export default function NewspaperStudio({ initialTemplate }: { initialTemplate?: string }) {
  const [saved, setSaved] = useLocalJson<NewspaperDraft>(NEWSPAPER_DRAFT, EMPTY_NEWSPAPER_DRAFT);
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

  const list = newspapers
    .map((n) => applyNewspaper(n, cat))
    .filter((n) => !cat.newspapers[n.slug]?.hidden || n.slug === draft.template || n.slug === bootSlug);
  const paper =
    list.find((n) => n.slug === draft.template) ||
    (bootSlug && list.find((n) => n.slug === bootSlug)) ||
    list[0] ||
    applyNewspaper(newspapers[0], cat);

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
      hint: `${p.slots.length} alan`,
      slots: p.slots,
      index: p.index,
    }));
  }, [pageEditors]);

  const active = pages.find((p) => p.id === page) || pages[0];
  const textSlots = active?.slots.filter((s) => s.kind === "field" || s.kind === "content") || [];
  const photoSlots = active?.slots.filter((s) => s.kind === "image") || [];

  useEffect(() => {
    let cancelled = false;
    setDesignLoading(true);
    setDesignErr("");
    fetch(`/api/times/${encodeURIComponent(paper.slug)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Şablon yüklenemedi");
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
        setDesignErr(err instanceof Error ? err.message : "Şablon yüklenemedi");
      });
    return () => {
      cancelled = true;
    };
  }, [paper.slug]);

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
    if (hasUser && draft.template === paper.slug) return;
    setSaved(
      normalizeNewspaperDraft({
        ...draft,
        template: paper.slug,
        values: { ...seedTimesValues(design), ...legacyDraftToTimesValues(draft), ...(draft.values || {}) },
        contents: { ...seedTimesContents(design), ...(draft.contents || {}) },
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
          if (!(values[slot.field.id] || "").trim()) e[slot.field.id] = `${slot.field.label} gerekli.`;
        }
        if (slot.kind === "image" && slot.required) {
          if (!(values[slot.fieldId] || "").trim()) e[slot.fieldId] = `${slot.label} gerekli.`;
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
      setPhotoErr(err instanceof Error ? err.message : "Görsel yüklenemedi.");
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
  const exitHref = `/tr/gazeteler/${paper.slug}`;
  const panelTitle =
    tool === "templates"
      ? "Hazır gazeteler"
      : tool === "pages"
        ? "Sayfalar"
        : tool === "text"
          ? "Metin alanları"
          : tool === "photos"
            ? "Fotoğraflar"
            : "Sipariş";

  return (
    <div className="ns-page">
      <div
        className="ns-app"
        data-panel-open={panelOpen ? "1" : "0"}
        data-inspector-open={inspectorOpen ? "1" : "0"}
        data-layout="desktop"
      >
        <header className="ns-top">
          <Link href={exitHref} className="ns-top__exit" aria-label="Gazete stüdyosundan çık">
            <Icon name="chevron-left" size={16} />
            <span className="ns-desktop-only">Çıkış</span>
          </Link>

          <div className="ns-top__doc">
            <input
              className="ns-top__title"
              value={paper.title}
              readOnly
              aria-label="Gazete adı"
              title={paper.title}
            />
            <span className="ns-status" role="status" data-state={status}>
              {status === "saved" ? "Kaydedildi" : "Taslak"}
            </span>
          </div>

          <div className="ns-top__group" role="group" aria-label="Düzenleme">
            <button type="button" className="ns-iconbtn" aria-label="Geri al" title="Geri al (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
              <Icon name="chevron-left" size={18} />
            </button>
            <button type="button" className="ns-iconbtn" aria-label="Yinele" title="Yinele (Ctrl+Y)" disabled={!canRedo} onClick={redo}>
              <Icon name="chevron-right" size={18} />
            </button>
          </div>

          <div className="ns-top__group ns-desktop-only" role="group" aria-label="Yakınlaştırma">
            <button type="button" className="ns-iconbtn" aria-label="Uzaklaştır" onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}>
              <Icon name="minus" size={16} />
            </button>
            <button type="button" className="ns-zoom__value" aria-label={`Yakınlaştırma %${Math.round(zoom * 100)}`} onClick={() => setZoom(1)}>
              %{Math.round(zoom * 100)}
            </button>
            <button type="button" className="ns-iconbtn" aria-label="Yakınlaştır" onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}>
              <Icon name="plus" size={16} />
            </button>
            <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => setFitTick((n) => n + 1)}>
              Sığdır
            </button>
          </div>

          <button
            type="button"
            className="ns-chip ns-desktop-only"
            onClick={() => patch({ size: draft.size === "A3" ? "A2" : "A3" })}
            aria-label={`Baskı boyutu: ${draft.size}`}
          >
            {draft.size} baskı
          </button>

          <div className="ns-top__end">
            <Link href={`/times/sablon/${paper.slug}`} className="ns-btn ns-btn--ghost ns-btn--sm" target="_blank" rel="noopener noreferrer">
              <Icon name="expand" size={14} />
              <span className="ns-desktop-only">Önizle</span>
            </Link>
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
              Sipariş
            </button>
          </div>
        </header>

        <div className="ns-body">
          <nav className="ns-rail" aria-label="Gazete araçları">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="ns-rail__btn"
                aria-pressed={tool === t.id && panelOpen}
                onClick={() => openTool(t.id)}
              >
                <Icon name={t.icon} size={22} />
                {t.label}
              </button>
            ))}
          </nav>

          <section className="ns-panelhost" id="ns-panel" aria-labelledby="ns-panel-title">
            <header className="ns-panelhost__head">
              <h2 className="ns-panelhost__title" id="ns-panel-title">
                {panelTitle}
              </h2>
              <button type="button" className="ns-iconbtn" aria-label="Paneli kapat" onClick={() => setPanelOpen(false)}>
                <Icon name="close" size={16} />
              </button>
            </header>
            <div className="ns-panelhost__body">
              {tool === "templates" ? (
                <>
                  <p className="ns-hint">Bir gazete seçin; kapak, hikâye, kareler ve teşekkür alanları otomatik gelir.</p>
                  <div className="ns-tgrid" role="list">
                    {list.map((n) => (
                      <button
                        key={n.slug}
                        type="button"
                        className={`ns-tcard${n.slug === paper.slug ? " is-on" : ""}`}
                        onClick={() => chooseTemplate(n.slug)}
                      >
                        <span className="ns-tcard__thumb">
                          {n.cover ? (
                            <Image src={n.cover} alt="" width={160} height={220} sizes="140px" />
                          ) : (
                            <span className="ns-tcard__ph" style={{ background: n.paper, color: n.ink }}>
                              {n.headline.slice(0, 1)}
                            </span>
                          )}
                        </span>
                        <span className="ns-tcard__name">{n.title}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {tool === "pages" ? (
                <>
                  <p className="ns-hint">Düzenlemek istediğiniz gazete sayfasını seçin.</p>
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
                    {active ? `${active.no} · ${active.label}` : "Sayfa yükleniyor…"} — metinler canlı gazeteye yazılır.
                  </p>
                  {designLoading ? <p className="ns-hint">Alanlar yükleniyor…</p> : null}
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
                    {!designLoading && !textSlots.length ? <p className="ns-hint">Bu sayfada metin alanı yok.</p> : null}
                  </div>
                </>
              ) : null}

              {tool === "photos" ? (
                <>
                  <p className="ns-hint">Sayfa fotoğraflarını yükleyin; önizleme anında güncellenir.</p>
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
                    {!photoSlots.length ? <p className="ns-hint">Bu sayfada fotoğraf alanı yok. Başka sayfa seçin.</p> : null}
                  </div>
                </>
              ) : null}

              {tool === "order" ? (
                <>
                  <div className="ns-recap">
                    <strong>{paper.title}</strong>
                    <span>{titleLine || "—"}</span>
                    <span className="field__hint">
                      {values.weddingDate || values.eventDate || draft.date || "Tarih yok"} · {values.venue || "Mekân yok"} ·{" "}
                      {draft.size}
                    </span>
                  </div>
                  <div className="ns-fields" style={{ marginBottom: 12 }}>
                    <label className="field">
                      <span className="field__label">Baskı boyutu</span>
                      <select className="input" value={draft.size} onChange={(e) => patch({ size: e.target.value as "A3" | "A2" })}>
                        <option value="A3">A3</option>
                        <option value="A2">A2</option>
                      </select>
                    </label>
                    <label className="field">
                      <span className="field__label">Kâğıt görünümü</span>
                      <select
                        className="input"
                        value={draft.style}
                        onChange={(e) => patch({ style: e.target.value as NewspaperDraft["style"] })}
                      >
                        <option value="original">Orijinal</option>
                        <option value="sepia">Eski kâğıt</option>
                        <option value="mono">Siyah beyaz</option>
                      </select>
                    </label>
                  </div>
                  <p className="ns-hint">Taslak tarayıcıda saklanır. Ödeme havale / EFT ile alınır.</p>
                  {payOpen || draft.orderCode ? (
                    <IbanCheckout
                      kind="gazete"
                      template={paper.slug}
                      title={paper.title}
                      previewTotal={paper.price}
                      snapshot={{
                        İsimler: titleLine,
                        Tarih: values.weddingDate || values.eventDate || "",
                        Mekan: values.venue || "",
                        Boyut: draft.size,
                        Hikaye: (values.story || "").slice(0, 280),
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
                      Havale ile devam et
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </section>

          <main className="ns-center" aria-label="Gazete tasarım alanı">
            <div className="ns-canvas" style={{ transform: `scale(${zoom})` }}>
              <div className="ns-canvas__stage">
                {previewData ? (
                  <TimesReader key={paper.slug} data={previewData} slug={paper.slug} embedded />
                ) : (
                  <div className="ns-canvas__empty">{designLoading ? "Gazete yükleniyor…" : "Şablon bulunamadı"}</div>
                )}
              </div>
            </div>
            <div className="ns-fab">
              <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => setInspectorOpen((v) => !v)}>
                <Icon name="sliders" size={14} /> Düzenle
              </button>
            </div>
          </main>

          <aside className="ns-inspector" aria-label="Düzenle">
            <header className="ns-inspector__head">
              <h2>{active ? active.label : "Gazete"}</h2>
              <p>
                {draft.size} · {paper.title}
                {active ? ` · ${active.slots.length} alan` : ""}
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => openTool("text")}>
                  Metin
                </button>
                <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => openTool("photos")}>
                  Fotoğraf
                </button>
                <button
                  type="button"
                  className="ns-btn ns-btn--ghost ns-btn--sm"
                  onClick={() => {
                    const i = pages.findIndex((p) => p.id === active?.id);
                    if (i >= 0 && i < pages.length - 1) setPage(pages[i + 1]!.id);
                  }}
                >
                  Sonraki sayfa
                </button>
              </div>
            </header>
            <div className="ns-inspector__body">
              <p className="ns-hint">Seçili sayfadaki alanlar. Değişiklikler ortadaki gazeteye anında yansır.</p>
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
