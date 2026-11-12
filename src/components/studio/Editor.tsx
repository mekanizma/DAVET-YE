"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import Icon from "../Icon";
import DesignCard from "./DesignCard";
import {
  blankState,
  designPresets,
  FONT_LABELS,
  getPreset,
  RATIOS,
  stateFromPreset,
  type Block,
  type DesignState,
  type FontKind,
  type FrameKind,
} from "@/data/designs";
import { downloadBlob } from "@/lib/format";
import { getLocalJson, setLocalJson } from "@/lib/storage";

const KEY = "studio-draft";
const FRAMES: Record<FrameKind, string> = { none: "Çerçevesiz", single: "Tek çizgi", double: "Çift çizgi", ornate: "Süslü köşeli" };

function fontCss(kind: FontKind): { family: string; weight: number } {
  const cs = getComputedStyle(document.documentElement);
  const v = {
    script: "--font-greatvibes",
    display: "--font-cinzel",
    condensed: "--font-bebas",
    serif: "--font-cormorant",
    body: "--font-inter",
  }[kind];
  const fallback = {
    script: "Great Vibes, cursive",
    display: "Cinzel, serif",
    condensed: "Bebas Neue, sans-serif",
    serif: "Cormorant Garamond, serif",
    body: "Inter, sans-serif",
  }[kind];
  return { family: cs.getPropertyValue(v).trim() || fallback, weight: kind === "display" ? 600 : 400 };
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = t;
    }
    out.push(line);
  }
  return out;
}

async function renderPng(d: DesignState, watermark: boolean): Promise<Blob | null> {
  const { w: W, h: H } = RATIOS[d.ratio];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const used = Array.from(new Set(d.blocks.filter((b) => b.text.trim()).map((b) => b.font)));
  await Promise.all(used.map((k) => document.fonts.load(`${fontCss(k).weight} 40px ${fontCss(k).family}`, "AaÇŞ").catch(() => [])));

  const g = ctx.createLinearGradient(0, 0, W * 0.35, H);
  g.addColorStop(0, d.bg);
  g.addColorStop(1, d.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  async function loadImg(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
  }

  if (d.cover) {
    try {
      const img = await loadImg(d.cover);
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } catch {
      /* keep gradient fallback */
    }
  }

  for (const layer of d.layers || []) {
    const x = (layer.x / 100) * W;
    const y = (layer.y / 100) * H;
    const w = (layer.w / 100) * W;
    const h = (layer.h / 100) * H;
    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;
    if (layer.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }
    if (layer.type === "shape") {
      ctx.fillStyle = layer.fill || "transparent";
      if ((layer.shape || "rect") === "ellipse" || layer.shape === "circle") {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
      if (layer.stroke && layer.strokeWidth) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = Math.max(1, (layer.strokeWidth / 100) * W);
        if ((layer.shape || "rect") === "ellipse" || layer.shape === "circle") ctx.stroke();
        else ctx.strokeRect(x, y, w, h);
      }
    } else if (layer.type === "line") {
      ctx.fillStyle = layer.stroke || "#000";
      ctx.fillRect(x, y, w, Math.max(1, (layer.strokeWidth || 0.35) / 100 * H));
    } else if (layer.type === "image") {
      try {
        const img = await loadImg(layer.src);
        ctx.drawImage(img, x, y, w, h);
      } catch {
        /* skip */
      }
    } else if (layer.type === "icon") {
      ctx.fillStyle = layer.stroke || "#888";
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  const inset = W * 0.045;
  ctx.strokeStyle = d.accent;
  if (d.frame !== "none") {
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  }
  if (d.frame === "double" || d.frame === "ornate") {
    ctx.lineWidth = Math.max(1, W * 0.002);
    const i2 = inset + W * 0.018;
    ctx.strokeRect(i2, i2, W - i2 * 2, H - i2 * 2);
  }
  if (d.frame === "ornate") {
    ctx.fillStyle = d.accent;
    const s = W * 0.03;
    for (const [x, y] of [
      [inset, inset],
      [W - inset, inset],
      [inset, H - inset],
      [W - inset, H - inset],
    ] as const) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    }
  }

  ctx.textBaseline = "middle";
  for (const b of d.blocks) {
    if (!b.text.trim()) continue;
    const f = fontCss(b.font);
    const px = (b.size / 100) * W;
    const weight = b.weight || f.weight;
    ctx.font = `${weight} ${px}px ${f.family}`;
    ctx.fillStyle = b.color || (b.tone === "accent" ? d.accent : d.ink);
    const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    if ("letterSpacing" in c) c.letterSpacing = `${(b.letterSpacing ?? 0) * px}px`;
    const boxW = typeof b.w === "number" ? (b.w / 100) * W : W * 0.84;
    const boxX = typeof b.x === "number" ? (b.x / 100) * W : (W - boxW) / 2;
    const align = b.align || "center";
    ctx.textAlign = align;
    const anchorX = align === "left" ? boxX : align === "right" ? boxX + boxW : boxX + boxW / 2;
    const lines = wrapLines(ctx, b.text, boxW);
    const lh = px * (b.lineHeight ?? 1.25);
    const top = (b.y / 100) * H - (lines.length * lh) / 2 + lh / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, anchorX, top + i * lh));
  }

  if (watermark) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = d.ink;
    ctx.font = `700 ${W * 0.1}px sans-serif`;
    const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    if ("letterSpacing" in c) c.letterSpacing = "0px";
    ctx.fillText("ÖRNEK · Davetanisi", 0, 0);
    ctx.restore();
  }
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}

export default function Editor({ initialPreset }: { initialPreset?: string }) {
  const [d, setD] = useState<DesignState>(() =>
    initialPreset === "bos" ? blankState() : stateFromPreset(getPreset(initialPreset)),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const restored = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; startY: number; startPct: number; h: number } | null>(null);

  // Restore the last local draft when the page was opened without a preset.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (initialPreset) return;
    const saved = getLocalJson<DesignState | null>(KEY, null);
    if (saved && Array.isArray(saved.blocks)) setD(saved);
  }, [initialPreset]);

  useEffect(() => {
    if (!restored.current) return;
    setLocalJson(KEY, d);
  }, [d]);

  const patch = (p: Partial<DesignState>) => setD((cur) => ({ ...cur, ...p }));
  const patchBlock = (id: string, p: Partial<Block>) =>
    setD((cur) => ({ ...cur, blocks: cur.blocks.map((b) => (b.id === id ? { ...b, ...p } : b)) }));

  function choosePreset(id: string) {
    setD(id === "bos" ? blankState() : stateFromPreset(getPreset(id), d.ratio));
    setSelected(null);
  }

  function onDown(e: PointerEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-block]");
    const box = stage.current?.getBoundingClientRect();
    if (!el || !box) return;
    const id = el.dataset.block!;
    const b = d.blocks.find((x) => x.id === id);
    if (!b) return;
    drag.current = { id, startY: e.clientY, startPct: b.y, h: box.height };
    setSelected(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    const dr = drag.current;
    if (!dr) return;
    const pct = dr.startPct + ((e.clientY - dr.startY) / dr.h) * 100;
    patchBlock(dr.id, { y: Math.round(Math.max(4, Math.min(96, pct)) * 10) / 10 });
  }
  function onUp() {
    drag.current = null;
  }

  async function download() {
    setBusy(true);
    setMsg("");
    try {
      const blob = await renderPng(d, true);
      if (!blob) throw new Error("canvas");
      downloadBlob(`davetiye-karti-${d.presetId}.png`, blob);
      setMsg("PNG indirildi (filigranlı).");
    } catch {
      setMsg("Görsel oluşturulamadı. Tarayıcınız canvas desteklemiyor olabilir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="editor">
      <div className="editor__preview">
        <div
          ref={stage}
          className="editor__stage"
          data-ratio={d.ratio}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <DesignCard design={d} watermark selected={selected} />
        </div>
        <p className="editor__tip">Metni parmağınızla ya da fareyle sürükleyebilir ya da aşağıdaki kaydırıcıları kullanabilirsiniz.</p>
      </div>

      <div className="editor__panel">
        <section className="editor__sec" aria-labelledby="e-start">
          <h2 id="e-start">Başlangıç</h2>
          <div className="field">
            <label className="field__label" htmlFor="e-preset">Tasarım</label>
            <select id="e-preset" className="select" value={d.presetId} onChange={(e) => choosePreset(e.target.value)}>
              <option value="bos">Boş sayfa</option>
              {designPresets.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.category}</option>)}
            </select>
            <p className="field__hint">Tasarım değiştirince metin ve renkler o tasarımın ayarlarına döner.</p>
          </div>
          <fieldset className="editor__fs">
            <legend className="field__label">Ölçü</legend>
            <div className="seg" role="radiogroup">
              {(Object.keys(RATIOS) as (keyof typeof RATIOS)[]).map((k) => (
                <label key={k} className={`seg__opt${d.ratio === k ? " is-on" : ""}`}>
                  <input type="radio" name="ratio" checked={d.ratio === k} onChange={() => patch({ ratio: k })} />
                  {RATIOS[k].label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="editor__sec" aria-labelledby="e-text">
          <h2 id="e-text">Metinler</h2>
          {d.blocks.map((b) => (
            <fieldset key={b.id} className={`editor__block${selected === b.id ? " is-sel" : ""}`} onFocus={() => setSelected(b.id)}>
              <legend>{b.label}</legend>
              <div className="field">
                <label className="field__label" htmlFor={`t-${b.id}`}>Metin</label>
                {b.text.includes("\n") || b.text.length > 48 || b.size < 5 ? (
                  <textarea id={`t-${b.id}`} className="textarea" rows={Math.min(5, Math.max(2, b.text.split("\n").length + 1))} value={b.text} onChange={(e) => patchBlock(b.id, { text: e.target.value })} maxLength={280} />
                ) : (
                  <input id={`t-${b.id}`} className="input" value={b.text} onChange={(e) => patchBlock(b.id, { text: e.target.value })} maxLength={80} />
                )}
              </div>
              <div className="field-row field-row--2">
                <div className="field">
                  <label className="field__label" htmlFor={`s-${b.id}`}>Boyut <span className="num">{b.size}</span></label>
                  <input id={`s-${b.id}`} type="range" min={2} max={24} step={0.2} value={b.size} onChange={(e) => patchBlock(b.id, { size: Number(e.target.value) })} />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor={`y-${b.id}`}>Dikey konum <span className="num">%{Math.round(b.y)}</span></label>
                  <input id={`y-${b.id}`} type="range" min={4} max={96} step={0.5} value={b.y} onChange={(e) => patchBlock(b.id, { y: Number(e.target.value) })} />
                </div>
              </div>
              <div className="field-row field-row--2">
                <div className="field">
                  <label className="field__label" htmlFor={`f-${b.id}`}>Yazı tipi</label>
                  <select id={`f-${b.id}`} className="select" value={b.font} onChange={(e) => patchBlock(b.id, { font: e.target.value as FontKind })}>
                    {(Object.keys(FONT_LABELS) as FontKind[]).map((k) => <option key={k} value={k}>{FONT_LABELS[k]}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor={`c-${b.id}`}>Renk</label>
                  <select id={`c-${b.id}`} className="select" value={b.tone} onChange={(e) => patchBlock(b.id, { tone: e.target.value as Block["tone"] })}>
                    <option value="ink">Metin rengi</option>
                    <option value="accent">Vurgu rengi</option>
                  </select>
                </div>
              </div>
            </fieldset>
          ))}
        </section>

        <section className="editor__sec" aria-labelledby="e-color">
          <h2 id="e-color">Renkler ve çerçeve</h2>
          <div className="editor__colors">
            {([
              ["bg", "Arka plan"],
              ["bg2", "Arka plan (alt)"],
              ["ink", "Metin"],
              ["accent", "Vurgu"],
            ] as const).map(([k, label]) => (
              <label key={k} className="color-pick">
                <input type="color" value={d[k]} onChange={(e) => patch({ [k]: e.target.value } as Partial<DesignState>)} />
                <span>{label}</span>
                <code className="num">{d[k]}</code>
              </label>
            ))}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="e-frame">Çerçeve</label>
            <select id="e-frame" className="select" value={d.frame} onChange={(e) => patch({ frame: e.target.value as FrameKind })}>
              {(Object.keys(FRAMES) as FrameKind[]).map((k) => <option key={k} value={k}>{FRAMES[k]}</option>)}
            </select>
          </div>
        </section>

        <section className="editor__sec" aria-labelledby="e-dl">
          <h2 id="e-dl">İndir</h2>
          <div className="editor__actions">
            <button type="button" className="btn btn--dark btn--lg btn--block" onClick={download} disabled={busy} aria-busy={busy}>
              <Icon name="download" size={16} /> {busy ? "Hazırlanıyor…" : "PNG indir (filigranlı, ücretsiz)"}
            </button>
            <button type="button" className="btn btn--outline btn--block" disabled aria-describedby="e-paid-note">
              Filigransız indir · 99 TL
            </button>
          </div>
          <p id="e-paid-note" className="field__hint">
            Filigransız indirme ve PDF çıktısı bu yerel kopyada yoktur (ödeme akışı test modundadır).
          </p>
          <p className="field__hint" role="status">{msg}</p>
          <button type="button" className="link-btn" onClick={() => choosePreset(d.presetId)}>Bu tasarımı sıfırla</button>
          <p className="field__hint">Taslağınız bu tarayıcıda otomatik kaydedilir. <Link href="/tr/tasarim-studyosu">Hazır tasarımlara dön</Link></p>
        </section>
      </div>
    </div>
  );
}
