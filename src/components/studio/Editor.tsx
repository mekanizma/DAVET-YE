"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import Icon from "../Icon";
import DesignCard from "./DesignCard";
import { useCatalog } from "@/components/CatalogProvider";
import { TextField } from "@/components/Field";
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
import { downloadBlob, formatTL, isEmail } from "@/lib/format";
import { studioCategory, studioName } from "@/i18n/catalog";
import { lp } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";
import { getLocalJson, setLocalJson } from "@/lib/storage";

const KEY = "studio-draft";
const UNLOCK_KEY = "studio-unlock-v1";

interface StudioUnlock {
  code: string;
  email: string;
  at: string;
}
const FRAMES_TR: Record<FrameKind, string> = { none: "Çerçevesiz", single: "Tek çizgi", double: "Çift çizgi", ornate: "Süslü köşeli" };
const FRAMES_EN: Record<FrameKind, string> = { none: "No frame", single: "Single line", double: "Double line", ornate: "Ornate corners" };
const FONT_EN: Record<FontKind, string> = {
  script: "Script (Great Vibes)",
  display: "Display (Cinzel)",
  condensed: "Condensed (Bebas)",
  serif: "Elegant (Cormorant)",
  body: "Plain (Inter)",
};
const RATIO_EN: Record<keyof typeof RATIOS, string> = {
  story: "Phone (9:16)",
  portrait: "Print (5×7)",
  square: "Square (1:1)",
};

function blockLabel(label: string, en: boolean) {
  if (!en) return label;
  const numbered = /^Metin (\d+)$/.exec(label);
  if (numbered) return `Text ${numbered[1]}`;
  const named: Record<string, string> = {
    "Üst başlık": "Top line",
    İsimler: "Names",
    Tarih: "Date",
    Mekân: "Venue",
  };
  return named[label] ?? label;
}

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

async function renderPng(d: DesignState, watermarkText: string | null): Promise<Blob | null> {
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

  if (watermarkText) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = d.ink;
    ctx.font = `700 ${W * 0.1}px sans-serif`;
    const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    if ("letterSpacing" in c) c.letterSpacing = "0px";
    ctx.fillText(watermarkText, 0, 0);
    ctx.restore();
  }
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}

export default function Editor({ initialPreset }: { initialPreset?: string }) {
  const locale = useLocale();
  const en = locale === "en";
  const cat = useCatalog();
  const params = useSearchParams();
  const frames = en ? FRAMES_EN : FRAMES_TR;
  const price = Math.max(0, Math.round(Number(cat.studioPrice) || 0));
  const cardsOn = Boolean(cat.cardPayments);
  const [d, setD] = useState<DesignState>(() =>
    initialPreset === "bos" ? blankState() : stateFromPreset(getPreset(initialPreset)),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(price === 0);
  const [payOpen, setPayOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payError, setPayError] = useState("");
  const [pending, setPending] = useState<StudioUnlock | null>(null);
  const restored = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; startY: number; startPct: number; h: number } | null>(null);
  const autoDl = useRef(false);

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

  useEffect(() => {
    if (price === 0) {
      setUnlocked(true);
      return;
    }
    const saved = getLocalJson<StudioUnlock | null>(UNLOCK_KEY, null);
    if (saved?.code && saved?.email) {
      setPending(saved);
      setEmail(saved.email);
    }
    const qCode = (params.get("odeme") || "").trim().toUpperCase();
    const qEmail = (params.get("email") || "").trim().toLowerCase();
    if (qCode && qEmail) {
      const next = { code: qCode, email: qEmail, at: new Date().toISOString() };
      setPending(next);
      setLocalJson(UNLOCK_KEY, next);
      setEmail(qEmail);
    }
  }, [params, price]);

  useEffect(() => {
    if (unlocked || price === 0) return;
    let stop = false;
    fetch("/api/hesap")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (stop || !data?.orders) return;
        const paid = (data.orders as { status?: string }[]).some((o) => o.status === "onaylandi");
        if (paid) setUnlocked(true);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [unlocked, price]);

  useEffect(() => {
    if (!pending?.code || !pending.email || unlocked) return;
    let stop = false;
    let timer = 0;
    async function check(silent = false) {
      try {
        const res = await fetch(
          `/api/siparis/${encodeURIComponent(pending!.code)}?email=${encodeURIComponent(pending!.email)}&odeme=1`,
        );
        if (stop || !res.ok) return;
        const data = await res.json();
        if (data?.order?.status === "onaylandi") {
          setUnlocked(true);
          setPending(null);
          setLocalJson(UNLOCK_KEY, { ...pending!, at: new Date().toISOString() });
          setMsg(en ? "Payment confirmed. You can download without a watermark." : "Ödeme onaylandı. Filigransız indirebilirsiniz.");
          return;
        }
        if (!silent) {
          setMsg(en ? "Payment is still pending. This page will refresh when Shopier confirms it." : "Ödeme onay bekliyor. Shopier doğrulayınca bu sayfa güncellenir.");
        }
      } catch {
        /* keep polling */
      }
      if (!stop) timer = window.setTimeout(() => void check(true), 4000);
    }
    void check();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [pending, unlocked, en]);

  useEffect(() => {
    if (!unlocked || !autoDl.current) return;
    autoDl.current = false;
    void downloadClean();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

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

  async function savePng(watermark: boolean) {
    setBusy(true);
    setMsg("");
    try {
      const mark = watermark ? (en ? "SAMPLE · Davetanisi" : "ÖRNEK · Davetanisi") : null;
      const blob = await renderPng(d, mark);
      if (!blob) throw new Error("canvas");
      downloadBlob(`davetiye-karti-${d.presetId}${watermark ? "" : "-hd"}.png`, blob);
      setMsg(
        watermark
          ? en
            ? "PNG downloaded (watermarked)."
            : "PNG indirildi (filigranlı)."
          : en
            ? "High-resolution PNG downloaded (no watermark)."
            : "Yüksek çözünürlüklü PNG indirildi (filigransız).",
      );
    } catch {
      setMsg(en ? "The image could not be created. Your browser may not support canvas." : "Görsel oluşturulamadı. Tarayıcınız canvas desteklemiyor olabilir.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    void savePng(true);
  }

  function downloadClean() {
    void savePng(false);
  }

  async function startPaid(ev: FormEvent) {
    ev.preventDefault();
    setPayError("");
    const er: string[] = [];
    if (name.trim().length < 3) er.push(en ? "Enter your full name." : "Ad soyad yazın.");
    if (!isEmail(email)) er.push(en ? "Enter a valid email." : "Geçerli bir e-posta yazın.");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) er.push(en ? "Enter a valid phone number." : "Geçerli bir telefon yazın.");
    if (er.length) {
      setPayError(er[0]);
      return;
    }
    if (!cardsOn) {
      setPayError(en ? "Card payment is not available right now." : "Kart ödemesi şu an açık değil.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/studio/odeme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          presetId: d.presetId,
          customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(typeof data.error === "string" ? data.error : en ? "Order could not be created." : "Sipariş oluşturulamadı.");
        return;
      }
      const order = data.order as { code: string; status: string; customer: { email: string }; total: number };
      const unlock = { code: order.code, email: order.customer.email, at: new Date().toISOString() };
      setLocalJson(UNLOCK_KEY, unlock);
      setPending(unlock);
      if (order.status === "onaylandi" || order.total <= 0) {
        setUnlocked(true);
        autoDl.current = true;
        setPayOpen(false);
        return;
      }
      if (data.shopierUrl) {
        window.location.assign(data.shopierUrl as string);
        return;
      }
      setPayError(en ? "Shopier could not be opened. Please try again shortly." : "Shopier açılamadı. Biraz sonra yeniden deneyin.");
    } catch {
      setPayError(en ? "The connection could not be made." : "Bağlantı kurulamadı.");
    } finally {
      setBusy(false);
    }
  }

  function onPaidClick() {
    if (unlocked || price === 0) {
      downloadClean();
      return;
    }
    setPayOpen(true);
    setMsg("");
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
          <DesignCard
            design={d}
            watermark={!unlocked}
            watermarkLabel={en ? "SAMPLE · Davetanisi" : "ÖRNEK · Davetanisi"}
            selected={selected}
          />
        </div>
        <p className="editor__tip">{en ? "Drag the text with your finger or the mouse, or use the sliders below." : "Metni parmağınızla ya da fareyle sürükleyebilir ya da aşağıdaki kaydırıcıları kullanabilirsiniz."}</p>
      </div>

      <div className="editor__panel">
        <section className="editor__sec" aria-labelledby="e-start">
          <h2 id="e-start">{en ? "Start" : "Başlangıç"}</h2>
          <div className="field">
            <label className="field__label" htmlFor="e-preset">{en ? "Design" : "Tasarım"}</label>
            <select id="e-preset" className="select" value={d.presetId} onChange={(e) => choosePreset(e.target.value)}>
              <option value="bos">{en ? "Blank page" : "Boş sayfa"}</option>
              {designPresets.map((p) => <option key={p.id} value={p.id}>{studioName(p.id, p.name, locale)} · {studioCategory(p.categoryKey || "", p.category, locale)}</option>)}
            </select>
            <p className="field__hint">{en ? "Changing the design restores that design's text and colours." : "Tasarım değiştirince metin ve renkler o tasarımın ayarlarına döner."}</p>
          </div>
          <fieldset className="editor__fs">
            <legend className="field__label">{en ? "Size" : "Ölçü"}</legend>
            <div className="seg" role="radiogroup">
              {(Object.keys(RATIOS) as (keyof typeof RATIOS)[]).map((k) => (
                <label key={k} className={`seg__opt${d.ratio === k ? " is-on" : ""}`}>
                  <input type="radio" name="ratio" checked={d.ratio === k} onChange={() => patch({ ratio: k })} />
                  {en ? RATIO_EN[k] : RATIOS[k].label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="editor__sec" aria-labelledby="e-text">
          <h2 id="e-text">{en ? "Text" : "Metinler"}</h2>
          {d.blocks.map((b) => (
            <fieldset key={b.id} className={`editor__block${selected === b.id ? " is-sel" : ""}`} onFocus={() => setSelected(b.id)}>
              <legend>{blockLabel(b.label, en)}</legend>
              <div className="field">
                <label className="field__label" htmlFor={`t-${b.id}`}>{en ? "Text" : "Metin"}</label>
                {b.text.includes("\n") || b.text.length > 48 || b.size < 5 ? (
                  <textarea id={`t-${b.id}`} className="textarea" rows={Math.min(5, Math.max(2, b.text.split("\n").length + 1))} value={b.text} onChange={(e) => patchBlock(b.id, { text: e.target.value })} maxLength={280} />
                ) : (
                  <input id={`t-${b.id}`} className="input" value={b.text} onChange={(e) => patchBlock(b.id, { text: e.target.value })} maxLength={80} />
                )}
              </div>
              <div className="field-row field-row--2">
                <div className="field">
                  <label className="field__label" htmlFor={`s-${b.id}`}>{en ? "Size" : "Boyut"} <span className="num">{b.size}</span></label>
                  <input id={`s-${b.id}`} type="range" min={2} max={24} step={0.2} value={b.size} onChange={(e) => patchBlock(b.id, { size: Number(e.target.value) })} />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor={`y-${b.id}`}>{en ? "Vertical position" : "Dikey konum"} <span className="num">%{Math.round(b.y)}</span></label>
                  <input id={`y-${b.id}`} type="range" min={4} max={96} step={0.5} value={b.y} onChange={(e) => patchBlock(b.id, { y: Number(e.target.value) })} />
                </div>
              </div>
              <div className="field-row field-row--2">
                <div className="field">
                  <label className="field__label" htmlFor={`f-${b.id}`}>{en ? "Font" : "Yazı tipi"}</label>
                  <select id={`f-${b.id}`} className="select" value={b.font} onChange={(e) => patchBlock(b.id, { font: e.target.value as FontKind })}>
                    {(Object.keys(FONT_LABELS) as FontKind[]).map((k) => <option key={k} value={k}>{en ? FONT_EN[k] : FONT_LABELS[k]}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor={`c-${b.id}`}>{en ? "Colour" : "Renk"}</label>
                  <select id={`c-${b.id}`} className="select" value={b.tone} onChange={(e) => patchBlock(b.id, { tone: e.target.value as Block["tone"] })}>
                    <option value="ink">{en ? "Text colour" : "Metin rengi"}</option>
                    <option value="accent">{en ? "Accent colour" : "Vurgu rengi"}</option>
                  </select>
                </div>
              </div>
            </fieldset>
          ))}
        </section>

        <section className="editor__sec" aria-labelledby="e-color">
          <h2 id="e-color">{en ? "Colours and frame" : "Renkler ve çerçeve"}</h2>
          <div className="editor__colors">
            {([
              ["bg", en ? "Background" : "Arka plan"],
              ["bg2", en ? "Background (bottom)" : "Arka plan (alt)"],
              ["ink", en ? "Text" : "Metin"],
              ["accent", en ? "Accent" : "Vurgu"],
            ] as const).map(([k, label]) => (
              <label key={k} className="color-pick">
                <input type="color" value={d[k]} onChange={(e) => patch({ [k]: e.target.value } as Partial<DesignState>)} />
                <span>{label}</span>
                <code className="num">{d[k]}</code>
              </label>
            ))}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="e-frame">{en ? "Frame" : "Çerçeve"}</label>
            <select id="e-frame" className="select" value={d.frame} onChange={(e) => patch({ frame: e.target.value as FrameKind })}>
              {(Object.keys(frames) as FrameKind[]).map((k) => <option key={k} value={k}>{frames[k]}</option>)}
            </select>
          </div>
        </section>

        <section className="editor__sec" aria-labelledby="e-dl">
          <h2 id="e-dl">{en ? "Download" : "İndir"}</h2>
          <div className="editor__actions">
            <button type="button" className="btn btn--dark btn--lg btn--block" onClick={download} disabled={busy} aria-busy={busy}>
              <Icon name="download" size={16} /> {busy ? (en ? "Preparing…" : "Hazırlanıyor…") : en ? "Download PNG (watermarked, free)" : "PNG indir (filigranlı, ücretsiz)"}
            </button>
            <button
              type="button"
              className="btn btn--outline btn--block"
              onClick={onPaidClick}
              disabled={busy}
              aria-busy={busy}
              aria-describedby="e-paid-note"
            >
              {unlocked || price === 0
                ? en
                  ? "Download without watermark"
                  : "Filigransız indir"
                : en
                  ? `Download without watermark · ${formatTL(price, locale)}`
                  : `Filigransız indir · ${formatTL(price, locale)}`}
            </button>
          </div>
          <p id="e-paid-note" className="field__hint">
            {unlocked
              ? en
                ? "Watermark-free download is unlocked on this device."
                : "Filigransız indirme bu cihazda açık."
              : en
                ? "Pay once with Shopier for a high-resolution PNG without the watermark. If you already bought an invitation or newspaper, sign in and it unlocks free."
                : "Filigransız, yüksek çözünürlüklü PNG için Shopier ile tek seferlik ödeme yapın. Davetiye veya gazete aldıysanız giriş yapınca ücretsiz açılır."}
          </p>
          {payOpen && !unlocked ? (
            <form className="editor__pay" onSubmit={startPaid} noValidate>
              <TextField id="studio-name" label={en ? "Full name" : "Ad soyad"} required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <TextField id="studio-email" label={en ? "Email" : "E-posta"} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <TextField id="studio-phone" label={en ? "Phone" : "Telefon"} type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
              {payError ? <p className="field__error" role="alert">{payError}</p> : null}
              <button type="submit" className="btn btn--dark btn--lg btn--block" disabled={busy || !cardsOn} aria-busy={busy}>
                {busy
                  ? en
                    ? "Opening Shopier…"
                    : "Shopier açılıyor…"
                  : cardsOn
                    ? en
                      ? `Pay with Shopier · ${formatTL(price, locale)}`
                      : `Shopier ile öde · ${formatTL(price, locale)}`
                    : en
                      ? "Card payment unavailable"
                      : "Kart ödemesi kapalı"}
              </button>
              <button type="button" className="link-btn" onClick={() => setPayOpen(false)}>{en ? "Cancel" : "Vazgeç"}</button>
            </form>
          ) : null}
          {pending && !unlocked ? (
            <p className="field__hint" role="status">
              {en ? `Waiting for Shopier · ${pending.code}` : `Shopier onayı bekleniyor · ${pending.code}`}{" "}
              <a href={`/api/siparis/${encodeURIComponent(pending.code)}/shopier?email=${encodeURIComponent(pending.email)}`}>
                {en ? "Open payment again" : "Ödemeyi yeniden aç"}
              </a>
            </p>
          ) : null}
          <p className="field__hint" role="status">{msg}</p>
          <button type="button" className="link-btn" onClick={() => choosePreset(d.presetId)}>{en ? "Reset this design" : "Bu tasarımı sıfırla"}</button>
          <p className="field__hint">{en ? "Your draft is saved in this browser automatically." : "Taslağınız bu tarayıcıda otomatik kaydedilir."} <Link href={lp(locale, "/tasarim-studyosu")}>{en ? "Back to ready-made designs" : "Hazır tasarımlara dön"}</Link></p>
        </section>
      </div>
    </div>
  );
}
