"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TimesPageSlot } from "@/lib/timesPages";
import type { NewspaperExtra } from "@/lib/newspaperExtras";

export type CanvasLayoutMap = Record<string, { x: number; y: number; w?: number; h?: number }>;

export type CanvasHit =
  | {
      id: string;
      source: "extra";
      label: string;
      x: number;
      y: number;
      w: number;
      h: number;
      movable: true;
      editable: "text" | "none";
    }
  | {
      id: string;
      source: "slot";
      slot: TimesPageSlot;
      label: string;
      x: number;
      y: number;
      w: number;
      h: number;
      movable: true;
      editable: "text" | "photo";
    };

type SheetFrame = { left: number; top: number; width: number; height: number; page: number };

type DragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function measureSheet(stage: HTMLElement, pageIndex: number): SheetFrame | null {
  const pageNo = String(pageIndex + 1);
  const sheets = [...stage.querySelectorAll<HTMLElement>(".tr-sheet")];
  let sheet =
    sheets.find((s) => s.dataset.page === pageNo) ||
    sheets.find((s) => {
      const r = s.getBoundingClientRect();
      return r.width > 40 && r.height > 40;
    }) ||
    null;
  if (!sheet) {
    const art = stage.querySelector<HTMLElement>(".tr-art, .stg-art");
    if (!art) return null;
    sheet = art;
  }
  const art = sheet.querySelector<HTMLElement>(".tr-art, .stg-art") || sheet;
  const stageBox = stage.getBoundingClientRect();
  const box = art.getBoundingClientRect();
  if (box.width < 20 || box.height < 20) return null;
  return {
    left: box.left - stageBox.left,
    top: box.top - stageBox.top,
    width: box.width,
    height: box.height,
    page: pageIndex + 1,
  };
}

function syncReaderPage(pageIndex: number) {
  const inst = (window as unknown as { DavetanisiTimes?: { _inst?: { jump?: (n: number) => void; leaves?: { jump?: (n: number) => void } } } })
    .DavetanisiTimes?._inst;
  if (!inst) return;
  try {
    if (typeof inst.jump === "function") inst.jump(pageIndex);
    else if (inst.leaves && typeof inst.leaves.jump === "function") inst.leaves.jump(pageIndex);
  } catch {
    /* ignore */
  }
}

export default function CanvasEditOverlay({
  stageRef,
  canvas,
  pageIndex,
  hits,
  selectedId,
  locale,
  onSelect,
  onMove,
  onResize,
  onRemove,
  onEditText,
}: {
  stageRef: React.RefObject<HTMLElement | null>;
  canvas: { width: number; height: number };
  pageIndex: number;
  hits: CanvasHit[];
  selectedId: string | null;
  locale: "tr" | "en";
  onSelect: (hit: CanvasHit | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, x: number, y: number, w: number, h: number) => void;
  onRemove: (id: string) => void;
  onEditText: (hit: CanvasHit) => void;
}) {
  const en = locale === "en";
  const [frame, setFrame] = useState<SheetFrame | null>(null);
  const [draftPos, setDraftPos] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const drag = useRef<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setFrame(measureSheet(stage, pageIndex));
      });
    };
    update();
    syncReaderPage(pageIndex);
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    const mo = new MutationObserver(update);
    mo.observe(stage, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", update);
    const t = window.setInterval(update, 800);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", update);
      window.clearInterval(t);
    };
  }, [stageRef, pageIndex, hits.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const hit = hits.find((h) => h.id === selectedId);
        if (hit?.source === "extra") {
          e.preventDefault();
          onRemove(selectedId);
        }
      }
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, hits, onRemove, onSelect]);

  const scaleX = frame ? frame.width / canvas.width : 1;
  const scaleY = frame ? frame.height / canvas.height : 1;

  const visibleHits = useMemo(() => {
    return hits.map((hit) => {
      const live = draftPos[hit.id];
      return live ? { ...hit, ...live } : hit;
    });
  }, [hits, draftPos]);

  function onPointerDown(e: React.PointerEvent, hit: CanvasHit, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onSelect(hit);
    drag.current = {
      id: hit.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: hit.x,
      origY: hit.y,
      origW: hit.w,
      origH: hit.h,
    };
    setDraftPos((prev) => ({ ...prev, [hit.id]: { x: hit.x, y: hit.y, w: hit.w, h: hit.h } }));
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || !frame) return;
    const dx = (e.clientX - d.startX) / scaleX;
    const dy = (e.clientY - d.startY) / scaleY;
    if (d.mode === "move") {
      const x = clamp(Math.round(d.origX + dx), 0, canvas.width - d.origW);
      const y = clamp(Math.round(d.origY + dy), 0, canvas.height - d.origH);
      setDraftPos((prev) => ({ ...prev, [d.id]: { x, y, w: d.origW, h: d.origH } }));
      return;
    }
    const w = clamp(Math.round(d.origW + dx), 24, canvas.width - d.origX);
    const h = clamp(Math.round(d.origH + dy), 16, canvas.height - d.origY);
    setDraftPos((prev) => ({ ...prev, [d.id]: { x: d.origX, y: d.origY, w, h } }));
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d) return;
    const pos = draftPos[d.id];
    drag.current = null;
    if (!pos) return;
    if (d.mode === "move") onMove(d.id, pos.x, pos.y);
    else onResize(d.id, pos.x, pos.y, pos.w, pos.h);
    setDraftPos((prev) => {
      const next = { ...prev };
      delete next[d.id];
      return next;
    });
  }

  if (!frame) {
    return (
      <div className="ns-edit ns-edit--waiting" aria-hidden="true">
        <span>{en ? "Preparing canvas…" : "Tuval hazırlanıyor…"}</span>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="ns-edit"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        if (e.target === overlayRef.current) onSelect(null);
      }}
    >
      <div
        className="ns-edit__sheet"
        style={{
          left: frame.left,
          top: frame.top,
          width: frame.width,
          height: frame.height,
        }}
      >
        <p className="ns-edit__hint">
          {en ? "Click a field · drag to move" : "Alana tıkla · sürükleyerek taşı"}
        </p>
        {visibleHits.map((hit) => {
          const selected = selectedId === hit.id;
          return (
            <button
              key={hit.id}
              type="button"
              className={`ns-edit__hit${selected ? " is-selected" : ""}${hit.source === "extra" ? " is-extra" : ""}`}
              style={{
                left: `${(hit.x / canvas.width) * 100}%`,
                top: `${(hit.y / canvas.height) * 100}%`,
                width: `${(hit.w / canvas.width) * 100}%`,
                height: `${(hit.h / canvas.height) * 100}%`,
              }}
              aria-label={hit.label}
              title={hit.label}
              onPointerDown={(e) => onPointerDown(e, hit, "move")}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (hit.editable !== "none") onEditText(hit);
              }}
            >
              {selected ? <span className="ns-edit__label">{hit.label}</span> : null}
              {selected && hit.movable ? (
                <span
                  className="ns-edit__handle"
                  onPointerDown={(e) => onPointerDown(e, hit, "resize")}
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Collect clickable/movable targets for the active design page. */
export function buildCanvasHits(opts: {
  pageElements: Array<Record<string, unknown> & { id?: string; type?: string; name?: string; x?: number; y?: number; w?: number; h?: number; fieldId?: string; edit?: unknown }>;
  slots: TimesPageSlot[];
  extras: NewspaperExtra[];
  pageId: string;
  layout?: CanvasLayoutMap;
  locale: "tr" | "en";
}): CanvasHit[] {
  const en = opts.locale === "en";
  const byId = new Map(opts.pageElements.filter((el) => el.id).map((el) => [String(el.id), el]));
  const hits: CanvasHit[] = [];

  for (const slot of opts.slots) {
    const el = byId.get(slot.id) || (slot.kind === "field" ? byId.get(slot.field.id) : undefined);
    // field slots use field element id often matching slot.id
    const el2 =
      el ||
      [...byId.values()].find((candidate) => {
        if (slot.kind === "field" && candidate.fieldId === slot.field.id) return true;
        if (slot.kind === "image" && candidate.fieldId === slot.fieldId) return true;
        if (slot.kind === "content" && candidate.id === slot.id) return true;
        return false;
      });
    if (!el2) continue;
    const layout = opts.layout?.[String(el2.id)];
    const x = layout?.x ?? (Number(el2.x) || 0);
    const y = layout?.y ?? (Number(el2.y) || 0);
    const w = layout?.w ?? (Number(el2.w) || 80);
    const h = layout?.h ?? (Number(el2.h) || 40);
    const label =
      slot.kind === "field"
        ? slot.field.label
        : slot.kind === "image"
          ? slot.label
          : slot.label;
    hits.push({
      id: String(el2.id),
      source: "slot",
      slot,
      label,
      x,
      y,
      w,
      h,
      movable: true,
      editable: slot.kind === "image" ? "photo" : "text",
    });
  }

  for (const ex of opts.extras.filter((e) => e.pageId === opts.pageId)) {
    const layout = opts.layout?.[ex.id];
    hits.push({
      id: ex.id,
      source: "extra",
      label: ex.kind === "text" ? ex.text || (en ? "Text" : "Metin") : ex.componentId || (en ? "Element" : "Bileşen"),
      x: layout?.x ?? ex.x,
      y: layout?.y ?? ex.y,
      w: layout?.w ?? ex.w,
      h: layout?.h ?? ex.h,
      movable: true,
      editable: ex.kind === "text" ? "text" : "none",
    });
  }

  return hits;
}
