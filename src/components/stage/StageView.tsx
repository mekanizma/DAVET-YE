"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import icons from "@/data/stage-icons.json";
import { RSVP_FORM_ENABLED } from "@/data/sections";
import type { Locale } from "@/i18n/locale";
import { editorLabel } from "@/i18n/editorLabel";
import { useLocale } from "@/i18n/provider";
import GiftBox from "@/components/stage/GiftBox";
import { sampleFor } from "@/data/sample";
import { uploadSharePhoto } from "@/lib/albumClient";
import type { InvitationDraft } from "@/lib/storage";
import { useDraft } from "@/lib/storage";

interface TextStyle {
  font?: string;
  size?: number;
  weight?: number;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: string;
  vAlign?: string;
  lineHeight?: number;
  letterSpacing?: number;
  transform?: string;
}

interface FormQuestion {
  id: string;
  type?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  onlyIfAttending?: boolean;
  min?: number;
  max?: number;
}

interface StageElement {
  id: string;
  type: string;
  name?: string;
  hidden?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
  z?: number;
  anim?: { kind?: string; delay?: number; duration?: number };
  text?: string;
  style?: TextStyle;
  fit?: string;
  minSize?: number;
  fieldId?: string;
  format?: string;
  src?: string;
  imageFit?: string;
  focusX?: number;
  focusY?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  shape?: string;
  clipShape?: string;
  shadow?: { x?: number; y?: number; blur?: number; color?: string };
  icon?: string;
  action?: string;
  hint?: string;
  button?: {
    fill?: string;
    fillTo?: string;
    gradientAngle?: number;
    icon?: string;
    iconAnim?: string;
    iconAnimSpeed?: number;
    iconSize?: number;
    text?: TextStyle;
  };
  zoom?: number;
  countdown?: {
    showSeconds?: boolean;
    daysLabel?: string;
    hoursLabel?: string;
    minutesLabel?: string;
    secondsLabel?: string;
    doneText?: string;
    number?: TextStyle;
    label?: TextStyle;
    separator?: string;
    separatorColor?: string;
    boxShape?: string;
    boxFill?: string;
    boxFillTo?: string;
    boxGradientAngle?: number;
    boxStroke?: string;
    boxStrokeWidth?: number;
    boxRadius?: number;
    boxGap?: number;
    boxShadow?: { color?: string; x?: number; y?: number; blur?: number };
    boxSquare?: boolean;
    boxOffsetY?: number;
    layout?: string;
    ringColor?: string;
    ringTrack?: string;
    ringWidth?: number;
  };
  list?: {
    itemGap?: number;
    layout?: string;
    markerShape?: string;
    markerColor?: string;
    markerTextColor?: string;
    markerSize?: number;
    markerFilled?: boolean;
    lineColor?: string;
    lineWidth?: number;
    cardRadius?: number;
    cardPadding?: number;
    styles?: { time?: TextStyle; title?: TextStyle; note?: TextStyle };
  };
  form?: {
    questions?: FormQuestion[];
    submitLabel?: string;
    successText?: string;
    style?: TextStyle & {
      gap?: number;
      panelPadding?: number;
      panelFill?: string;
      panelStroke?: string;
      panelRadius?: number;
      inputBorder?: string;
      inputColor?: string;
      inputBackground?: string;
      radius?: number;
      buttonBackground?: string;
      buttonColor?: string;
      size?: number;
      labelColor?: string;
      labelCaps?: boolean;
      labelSize?: number;
      labelFont?: string;
      look?: string;
      accentColor?: string;
      placeholderColor?: string;
      borderWidth?: number;
      stepper?: boolean;
    };
  };
}

type StageFile = {
  design: {
    canvas: { width: number; height: number };
    background: { color?: string; image?: string; fit?: string };
    intro?: {
      video?: string;
      poster?: string;
      /** Textless opening assets — preferred for English so burned-in Turkish copy is not shown. */
      neutralVideo?: string;
      neutralPoster?: string;
      videoBackground?: string;
      videoMuted?: boolean;
      skippable?: boolean;
      skipLabel?: string;
      gate?: { name?: string; elements?: StageElement[] };
    };
    pages: Array<{ id: string; name: string; kind?: string; elements?: StageElement[] }>;
    chrome?: { color?: string; background?: string };
  };
  values?: Record<string, string>;
  places?: Record<string, { query?: string; lat?: number; lng?: number }>;
  lists?: Record<string, Array<Record<string, string>>>;
  messages?: Array<{ name?: string; text?: string }>;
  music?: { src?: string; title?: string; volume?: number; loop?: boolean } | null;
  fonts?: Array<{ family: string; url: string; minWeight: number; maxWeight: number }>;
  title?: string;
};

const ICON_SET = icons as Record<string, { label: string; path: string }>;

function keepGiftChrome(el: StageElement, elements: StageElement[]) {
  if (el.action === "nextPage") return true;
  if (el.type !== "shape") return false;
  return elements.some((next) => {
    if (next.action !== "nextPage") return false;
    const dx = el.x + el.w / 2 - (next.x + next.w / 2);
    const dy = el.y + el.h / 2 - (next.y + next.h / 2);
    return Math.abs(dx) < 36 && Math.abs(dy) < 36;
  });
}

function giftHexLum(color?: string) {
  const raw = (color || "").trim();
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (!hex) return 0.5;
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const r = Number.parseInt(full.slice(0, 2), 16) / 255;
  const g = Number.parseInt(full.slice(2, 4), 16) / 255;
  const b = Number.parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function giftPalette(elements: StageElement[]) {
  const copy = elements.find((el) => el.action === "copy");
  const texts = elements.filter((el) => el.type === "text" && !el.hidden);
  const title = texts.find((el) => /hediye|gift|iban/i.test(`${el.name || ""} ${el.text || ""}`)) || texts[0];
  const ink = title?.style?.color || copy?.button?.color || "#e8d3a4";
  const accent = copy?.fill || copy?.button?.fill || title?.style?.color || "#8a6d4b";
  /* Prefer plan title ink; if it is a washed mid-tone, fall back to accent so labels stay readable. */
  const inkLum = giftHexLum(ink);
  const washed = inkLum > 0.32 && inkLum < 0.72 && Math.abs(inkLum - giftHexLum(accent)) > 0.12;
  const label = washed ? accent : ink;
  return { accent, ink, label };
}

function openingWishes(stage: StageFile, locale: Locale) {
  const rows = (stage.messages || []).filter((wish) => (wish.text || "").trim());
  if (rows.length) return rows;
  return sampleFor(locale).wishes.map((wish) => ({ name: wish.name, text: wish.text }));
}

/** Translate leftover Turkish editor labels without mangling already-English copy (e.g. IBAN). */
function stageLabel(raw: string | undefined, locale: Locale) {
  const text = (raw || "").trim();
  if (!text || locale !== "en") return text;
  if (!/[çğıöşüÇĞİÖŞÜ]/i.test(text) && !/\b(davetiye|takvim|kameray[ıi]|geçiş|başlık|açıklama|aile|hediye|dilek|anı|kapanış|mekân|çelenk)\b/i.test(text)) {
    return text;
  }
  return editorLabel(text, locale);
}

const HIDE: Record<string, string> = {
  families: "aileler",
  date: "tarih",
  location: "konum",
  countdown: "geri-sayim",
  timeline: "program",
  rsvp: "katilim",
  memoryWall: "ani-duvari",
  lens: "ani-cekimi",
  messages: "dilekler",
  gift: "iban",
  closing: "kapanis",
};

function contentReach(design: StageFile["design"]) {
  const canvasH = design.canvas?.height || 844;
  const mid = canvasH / 2;
  const pages: Array<{ height?: number; elements?: StageElement[] }> = [...(design.pages || [])];
  if (design.intro?.gate) pages.push(design.intro.gate);
  let max = 0;
  for (const page of pages) {
    if (page.height && page.height > canvasH) continue;
    for (const el of page.elements || []) {
      if (el.hidden || el.opacity === 0) continue;
      const rot = ((el.rotation || 0) * Math.PI) / 180;
      const half = (Math.abs(el.w * Math.sin(rot)) + Math.abs(el.h * Math.cos(rot))) / 2;
      const center = el.y + el.h / 2;
      max = Math.max(max, mid - (center - half) + 14, center + half - mid + 14);
    }
  }
  const capped = Math.min(max, canvasH / 2);
  return capped > 0 ? capped : mid;
}

function cq(n: number, canvasW: number) {
  return `${(n / canvasW) * 100}cqw`;
}

function boxStyle(el: StageElement, canvasW: number): CSSProperties {
  const min = Math.min(el.w, el.h);
  const radius =
    el.shape === "ellipse" || el.shape === "circle" || el.clipShape === "ellipse" || (el.radius ?? 0) >= min / 2 - 0.2
      ? "50%"
      : cq(el.radius || 0, canvasW);
  return {
    left: cq(el.x, canvasW),
    top: cq(el.y, canvasW),
    width: cq(el.w, canvasW),
    height: cq(el.h, canvasW),
    opacity: el.opacity ?? 1,
    zIndex: el.z,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    borderRadius: radius,
  };
}

function fontStack(font?: string) {
  if (!font) return undefined;
  const name = font.replace(/"/g, "");
  // Theme font first (matches original). Greek fallbacks only for missing glyphs.
  if (/jost|montserrat|inter|poppins|raleway|nunito|manrope|outfit|lato|roboto/i.test(name)) {
    return `"${name}", "Dv Sans Greek", "Dv Sans", sans-serif`;
  }
  if (/beau|charm|script|vibes|allura|italianno|pinyon|alex brush|tangerine|sacramento|parisienne|great/i.test(name)) {
    return `"${name}", "Dv Script Greek", "Dv Script", cursive`;
  }
  return `"${name}", "Dv Display Greek", "Dv Display", serif`;
}

function textCss(style: TextStyle | undefined, canvasW: number): CSSProperties {
  if (!style) return {};
  const transform = style.transform === "upper" ? "uppercase" : style.transform === "lower" ? "lowercase" : "none";
  const align = style.align === "left" || style.align === "right" ? style.align : "center";
  return {
    fontFamily: fontStack(style.font),
    fontSize: `calc(${((style.size || 16) / canvasW) * 100}cqw * var(--fit, 1))`,
    fontWeight: style.weight,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    color: style.color,
    textAlign: align,
    lineHeight: style.lineHeight || 1.25,
    letterSpacing: style.letterSpacing ? `${style.letterSpacing}em` : undefined,
    textTransform: transform,
    justifyContent: align === "right" ? "flex-end" : align === "left" ? "flex-start" : "center",
    alignItems: style.vAlign === "bottom" ? "flex-end" : style.vAlign === "top" ? "flex-start" : "center",
  };
}

function formatField(raw: string, format: string | undefined, locale: Locale) {
  if (!raw) return "";
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const zone = "Europe/Istanbul";
  const loc = locale === "en" ? "en-GB" : "tr-TR";
  const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: zone, ...options }).format(d);
  const long = fmt({ day: "numeric", month: "long", year: "numeric" });
  if (format === "time") {
    const clock = fmt({ hour: "2-digit", minute: "2-digit" });
    return locale === "en" ? clock : `Saat ${clock}`;
  }
  if (format === "weekday") return fmt({ weekday: "long" });
  if (format === "day") return fmt({ day: "numeric" });
  if (format === "month") return fmt({ month: "long" });
  if (format === "year") return fmt({ year: "numeric" });
  if (format === "monthYear") return fmt({ month: "long", year: "numeric" });
  if (format === "full") return `${long} ${fmt({ weekday: "long" })}`;
  if (format === "short") return fmt({ day: "numeric", month: "short", year: "numeric" });
  return long;
}

function shadowOf(el: StageElement, canvasW: number) {
  const s = el.shadow;
  if (!s) return undefined;
  return `${cq(s.x || 0, canvasW)} ${cq(s.y || 0, canvasW)} ${cq(s.blur || 0, canvasW)} ${s.color}`;
}

function StageIcon({ name, anim, speed, size, strokeWidth = 1.6 }: { name?: string; anim?: string; speed?: number; size?: number; strokeWidth?: number }) {
  if (!name) return null;
  const spec = ICON_SET[name];
  if (!spec) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      className="stg-ico"
      data-icon-anim={anim && anim !== "none" ? anim : undefined}
      style={{ width: size ? `${size}em` : undefined, height: size ? `${size}em` : undefined, ["--icon-dur" as string]: speed ? `${speed}s` : undefined }}
      aria-hidden="true"
    >
      <path d={spec.path} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TextBlock({ el, canvasW, value }: { el: StageElement; canvasW: number; value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const shrink = el.fit === "shrink" || el.fit === "auto" || !el.fit;
    if (!shrink) return;

    const apply = () => {
      const inner = host.querySelector(".stg-text__c") as HTMLElement | null;
      if (!inner) return;
      if (!host.clientWidth || !host.clientHeight) return;
      const min = Math.min(1, (el.minSize || 6) / (el.style?.size || 16));
      let lo = min;
      let hi = 1;
      host.style.setProperty("--fit", "1");
      if (inner.scrollHeight <= host.clientHeight + 1 && inner.scrollWidth <= host.clientWidth + 1) return;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        host.style.setProperty("--fit", String(mid));
        if (inner.scrollHeight <= host.clientHeight + 1 && inner.scrollWidth <= host.clientWidth + 1) lo = mid;
        else hi = mid;
      }
      host.style.setProperty("--fit", String(Math.max(min, lo * 0.98)));
    };

    apply();
    let cancelled = false;
    const afterFonts = () => {
      if (!cancelled) apply();
    };
    if (document.fonts?.ready) document.fonts.ready.then(afterFonts).catch(() => undefined);
    document.fonts?.addEventListener?.("loadingdone", afterFonts);
    const ro = new ResizeObserver(apply);
    ro.observe(host);
    const page = host.closest(".stg-page");
    const stage = host.closest(".stg");
    const mo = new MutationObserver(() => {
      if (!page || page.classList.contains("is-in") || stage?.getAttribute("data-phase") === "open") apply();
    });
    if (page) mo.observe(page, { attributes: true, attributeFilter: ["class"] });
    if (stage) mo.observe(stage, { attributes: true, attributeFilter: ["data-phase", "class"] });
    return () => {
      cancelled = true;
      ro.disconnect();
      mo.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", afterFonts);
    };
  }, [value, el.fit, el.minSize, el.style?.size, el.style?.letterSpacing, el.style?.font]);
  return (
    <div ref={ref} className={el.type === "field" ? "stg-field" : "stg-text"} style={textCss(el.style, canvasW)}>
      <span className="stg-text__c">{value}</span>
    </div>
  );
}

function countdownFaceStyle(c: NonNullable<StageElement["countdown"]>, canvasW: number): CSSProperties | undefined {
  const ring = c.layout === "rings";
  if (!c.boxFill && !ring) return undefined;
  const shadow = c.boxShadow?.color
    ? `${cq(c.boxShadow.x || 0, canvasW)} ${cq(c.boxShadow.y || 0, canvasW)} ${cq(c.boxShadow.blur || 0, canvasW)} ${c.boxShadow.color}`
    : undefined;
  const offset = c.boxOffsetY ? { marginTop: cq(c.boxOffsetY, canvasW) } : undefined;
  if (ring && !c.boxFill) {
    return {
      ...offset,
      borderRadius: "999px",
      border: `${cq(c.ringWidth || 2.5, canvasW)} solid ${c.ringColor || c.number?.color || "currentColor"}`,
      background: c.ringTrack || "transparent",
      boxShadow: shadow,
    };
  }
  const radius =
    ring || c.boxShape === "ellipse"
      ? "999px"
      : c.boxShape === "arch"
        ? `${cq(Math.max(c.boxRadius || 16, 16), canvasW)} ${cq(Math.max(c.boxRadius || 16, 16), canvasW)} ${cq(c.boxRadius || 8, canvasW)} ${cq(c.boxRadius || 8, canvasW)}`
        : cq(c.boxRadius || 0, canvasW);
  return {
    ...offset,
    borderRadius: radius,
    background: c.boxFillTo ? `linear-gradient(${c.boxGradientAngle || 180}deg, ${c.boxFill}, ${c.boxFillTo})` : c.boxFill,
    border: c.boxStrokeWidth ? `${cq(Math.max(c.boxStrokeWidth, 1), canvasW)} solid ${c.boxStroke || "transparent"}` : undefined,
    boxShadow: shadow,
  };
}

function Countdown({ el, canvasW, iso, locale }: { el: StageElement; canvasW: number; iso?: string; locale: Locale }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = iso ? new Date(iso).getTime() : NaN;
  const c = el.countdown || {};
  const left = now == null ? 0 : Math.max(0, target - now);
  const done = now != null && (!Number.isFinite(target) || left <= 0);
  const en = locale === "en";
  const parts = [
    { n: Math.floor(left / 86400000), l: c.daysLabel || (en ? "Days" : "Gün") },
    { n: Math.floor(left / 3600000) % 24, l: c.hoursLabel || (en ? "Hours" : "Saat") },
    { n: Math.floor(left / 60000) % 60, l: c.minutesLabel || (en ? "Minutes" : "Dakika") },
    ...(c.showSeconds === false ? [] : [{ n: Math.floor(left / 1000) % 60, l: c.secondsLabel || (en ? "Seconds" : "Saniye") }]),
  ];
  if (done) {
    return (
      <div className="stg-text" style={textCss(c.number || el.style, canvasW)}>
        <span className="stg-text__c">{c.doneText || (en ? "Today is the day!" : "Bugün o gün!")}</span>
      </div>
    );
  }
  const face = countdownFaceStyle(c, canvasW);
  const ring = c.layout === "rings";
  const square = Boolean(c.boxSquare || ring || c.boxShape === "ellipse");
  return (
    <div className="stg-count" style={{ gap: c.boxGap != null ? cq(c.boxGap, canvasW) : undefined }}>
      {parts.map((p, i) => (
        <div key={p.l} style={{ display: "contents" }}>
          {i > 0 && c.separator !== "none" ? <span className="stg-count__sep" style={{ background: c.separatorColor || "currentColor" }} /> : null}
          <div className={"stg-count__cell" + (square ? " is-square" : "")}>
            <div className="stg-count__face" style={face}>
              <span className="stg-count__n" style={textCss(c.number, canvasW)}>
                {String(p.n).padStart(2, "0")}
              </span>
              {!ring ? <span className="stg-count__label" style={textCss(c.label, canvasW)}>{p.l}</span> : null}
            </div>
            {ring ? <span className="stg-count__label" style={textCss(c.label, canvasW)}>{p.l}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

type Shot = { id: string; url: string };

export default function StageView({
  stage,
  slug,
  embed = false,
  useDraftData = false,
  record = false,
  locale: localeProp,
  guestDraft = null,
  albumSlug = "",
}: {
  stage: StageFile;
  slug: string;
  embed?: boolean;
  useDraftData?: boolean;
  /** Admin export: show the ready template, one screen at a time, with sample names. */
  record?: boolean;
  locale?: Locale;
  guestDraft?: InvitationDraft | null;
  albumSlug?: string;
}) {
  const contextLocale = useLocale();
  const locale = localeProp ?? contextLocale;
  const en = locale === "en";
  const { design } = stage;
  const canvasW = design.canvas?.width || 390;
  const canvasH = design.canvas?.height || 844;
  const stored = useDraft();
  const draft = guestDraft ?? stored.draft;
  const ready = guestDraft ? true : stored.ready;
  const live = Boolean(guestDraft) || (useDraftData && ready);
  const values = useMemo(() => {
    const base = { ...(stage.values || {}) };
    if (!live) return base;
    const info = draft.info;
    const put = (id: string, v: string) => {
      if (v.trim()) base[id] = v.trim();
    };
    put("f_first", info.partnerA);
    put("f_second", info.partnerB);
    put("f_familyA", info.brideFamily);
    put("f_familyB", info.groomFamily);
    put("f_venueName", info.venue);
    put("f_address", info.address);
    put("f_intro", info.message);
    // Stages ship f_storyText in values; most layouts surface the prose on the families note.
    put("f_storyText", info.story);
    put("f_familyNote", info.familyNote || info.story);
    put("f_closing", info.closing);
    put("f_dressCode", info.dressCode);
    put("f_menu", info.menu);
    put("f_iban", info.iban);
    put("f_ibanOwner", info.ibanHolder);
    // Wall times are always Europe/Istanbul (+03), not the browser's local zone.
    const istanbulIso = (date: string, time: string) => {
      const t = (time || "19:00").length === 5 ? `${time}:00` : time;
      return new Date(`${date}T${t}+03:00`).toISOString();
    };
    if (info.date) {
      const iso = istanbulIso(info.date, info.time || "19:00");
      base.f_mainDate = iso;
      base.f_ev_dugun_date = iso;
    }
    if (info.kinaDate) {
      base.f_ev_kina_date = istanbulIso(info.kinaDate, info.kinaTime || "19:00");
    }
    return base;
  }, [stage.values, live, draft.info]);

  const lists = useMemo(() => {
    const base = { ...(stage.lists || {}) };
    if (!live) return base;
    const rows = (draft.program || [])
      .filter((p) => p.time.trim() || p.title.trim())
      .map((p) => ({
        time: p.time.trim(),
        title: p.title.trim(),
        note: (p.note || "").trim(),
        ceremony: "dugun",
      }));
    if (rows.length) base.f_flow = rows;
    return base;
  }, [stage.lists, live, draft.program]);

  const hidden = useMemo(() => new Set(live ? draft.hiddenSections : []), [live, draft.hiddenSections]);
  const pages = design.pages.filter((p) => {
    if (!RSVP_FORM_ENABLED && p.kind === "rsvp") return false;
    const key = p.kind ? HIDE[p.kind] : undefined;
    return !key || !hidden.has(key);
  });

  const reduced = usePrefersReduced();
  const [phase, setPhase] = useState<"gate" | "video" | "open">(design.intro?.gate ? "gate" : "open");
  const [shot, setShot] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const [photos, setPhotos] = useState<Shot[]>([]);
  const [photoNote, setPhotoNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!albumSlug) return;
    let stop = false;
    fetch(`/api/d/${encodeURIComponent(albumSlug)}/foto`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = Array.isArray(data?.photos) ? data.photos as Shot[] : [];
        if (!stop) {
          const next = rows.filter((row) => row?.id && row?.url);
          setPhotos((cur) => {
            const ids = new Set(next.map((row) => row.id));
            return [...next, ...cur.filter((row) => !ids.has(row.id))];
          });
        }
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [albumSlug]);

  async function addShot(file: File, source: "wall" | "lens") {
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setPhotoNote({ ok: false, text: en ? "Use a JPG, PNG or WEBP under 8 MB." : "JPG, PNG veya WEBP yükleyin; 8 MB’ı geçmesin." });
      return;
    }
    if (!albumSlug) {
      setPhotos((cur) => [...cur, { id: `local-${Date.now()}`, url: URL.createObjectURL(file) }]);
      return;
    }
    setPhotoNote({ ok: true, text: en ? "Saving the photo…" : "Fotoğraf kaydediliyor…" });
    try {
      const saved = await uploadSharePhoto(albumSlug, file, source, file.name || "foto.jpg");
      setPhotos((cur) => [...cur, saved]);
      setPhotoNote({ ok: true, text: en ? "Saved to the album." : "Albüme kaydedildi." });
    } catch (err) {
      setPhotoNote({ ok: false, text: err instanceof Error ? err.message : (en ? "The photo could not be saved." : "Fotoğraf kaydedilemedi.") });
    }
  }

  const [rsvpDone, setRsvpDone] = useState(false);
  const [wishDone, setWishDone] = useState(false);
  const [wishes, setWishes] = useState(() => openingWishes(stage, locale));
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intro = design.intro;
  const introVideo = en && intro?.neutralVideo ? intro.neutralVideo : intro?.video;
  const desk = design.background?.color || "#cb6715";

  useEffect(() => {
    const root = scrollRef.current;
    if (record || !root || phase !== "open") return;
    const nodes = [...root.querySelectorAll(".stg-page")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle("is-in", e.isIntersecting && e.intersectionRatio >= 0.28);
      },
      { root, threshold: [0, 0.28, 0.6] },
    );
    nodes.forEach((n) => io.observe(n));
    // First page must animate immediately when the invite opens.
    nodes[0]?.classList.add("is-in");
    return () => io.disconnect();
  }, [phase, pages.length, record]);

  // Desktop mouse/trackpad (and free swipe) must not change pages — only nextPage button.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || phase !== "open") return;
    const wishList = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>(".stg-messages__list, .stg-gift__sheet") : null;
    const stopWheel = (e: WheelEvent) => {
      const list = wishList(e.target);
      if (list && list.scrollHeight > list.clientHeight + 2) {
        const atTop = list.scrollTop <= 0 && e.deltaY < 0;
        const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 2 && e.deltaY > 0;
        if (!atTop && !atBottom) return;
      }
      e.preventDefault();
    };
    const stopTouch = (e: TouchEvent) => {
      if (wishList(e.target)) return;
      e.preventDefault();
    };
    const stopKeys = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.matches?.("input, textarea, select, [contenteditable='true']")) return;
      if (["PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End", " "].includes(e.key)) {
        e.preventDefault();
      }
    };
    root.addEventListener("wheel", stopWheel, { passive: false });
    root.addEventListener("touchmove", stopTouch, { passive: false });
    root.addEventListener("keydown", stopKeys);
    return () => {
      root.removeEventListener("wheel", stopWheel);
      root.removeEventListener("touchmove", stopTouch);
      root.removeEventListener("keydown", stopKeys);
    };
  }, [phase]);

  /**
   * The soft keyboard used to shrink the stage and let scroll-snap jump to another
   * page. Keep the stage size frozen and slide only the focused page's art.
   */
  useEffect(() => {
    if (embed) return;
    const shell = stageRef.current?.closest(".stg-root") as HTMLElement | null;
    if (!shell) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const apply = () => {
      const editing =
        shell.classList.contains("is-typing") ||
        !!shell.querySelector("input:focus, textarea:focus, select:focus");
      if (editing) return;
      const vv = window.visualViewport;
      const h = Math.round(vv?.height || window.innerHeight);
      const top = Math.round(vv?.offsetTop || 0);
      shell.style.setProperty("--vvh", `${h}px`);
      shell.style.setProperty("--vv-top", `${top}px`);
    };
    apply();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("orientationchange", apply);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      shell.style.removeProperty("--vvh");
      shell.style.removeProperty("--vv-top");
    };
  }, [embed]);

  useEffect(() => {
    const el = videoRef.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const fit = () => {
      if (!el.videoWidth || !el.videoHeight) return;
      const phone = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;
      if (!phone) {
        el.style.width = "";
        el.style.height = "";
        el.style.left = "";
        el.style.top = "";
        el.style.right = "";
        el.style.bottom = "";
        el.style.transform = "";
        el.style.maxWidth = "";
        return;
      }
      const scale = Math.max(box.clientWidth / el.videoWidth, box.clientHeight / el.videoHeight);
      el.style.width = `${Math.ceil(el.videoWidth * scale)}px`;
      el.style.height = `${Math.ceil(el.videoHeight * scale)}px`;
      el.style.left = "50%";
      el.style.top = "50%";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.transform = "translate(-50%, -50%)";
      el.style.maxWidth = "none";
      el.style.objectFit = "cover";
    };
    el.addEventListener("loadedmetadata", fit);
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    fit();
    return () => {
      el.removeEventListener("loadedmetadata", fit);
      observer.disconnect();
    };
  }, [phase, introVideo]);

  useEffect(() => {
    if (phase !== "open") return;
    const root = scrollRef.current;
    const shell = root?.closest(".stg-root") as HTMLElement | null;
    if (!root || !shell) return;

    let frozen = root.scrollTop;
    let blurTimer = 0;
    const innerFrozen = new Map<HTMLElement, number>();
    const isField = (el: EventTarget | null): el is HTMLElement =>
      el instanceof HTMLElement && !!el.matches("input, textarea, select");

    const holdPage = () => {
      if (!shell.classList.contains("is-typing")) return;
      if (Math.abs(root.scrollTop - frozen) > 1) root.scrollTop = frozen;
      root.querySelectorAll<HTMLElement>(".stg-form, .stg-messages").forEach((el) => {
        if (!innerFrozen.has(el)) innerFrozen.set(el, el.scrollTop);
        const want = innerFrozen.get(el) ?? 0;
        if (Math.abs(el.scrollTop - want) > 1) el.scrollTop = want;
      });
    };

    const liftField = (field: HTMLElement) => {
      const art = field.closest(".stg-art") as HTMLElement | null;
      const page = field.closest(".stg-page") as HTMLElement | null;
      if (!art || !page) return;
      if (Math.abs(page.offsetTop - root.scrollTop) > 2) return;
      art.style.transition = "none";
      art.style.transform = "";
      const vv = window.visualViewport;
      const top = vv?.offsetTop ?? 0;
      const limit = top + (vv?.height ?? window.innerHeight) - 16;
      const rect = field.getBoundingClientRect();
      const delta = Math.ceil(rect.bottom - limit);
      art.style.transform = delta > 0 ? `translateY(${-delta}px)` : "";
    };

    const clearLifts = () => {
      root.querySelectorAll<HTMLElement>(".stg-art").forEach((art) => {
        art.style.transition = "";
        art.style.transform = "";
      });
    };

    const begin = (field: HTMLElement) => {
      const page = field.closest(".stg-page") as HTMLElement | null;
      window.clearTimeout(blurTimer);
      const pageChanged = !!page && Math.abs(page.offsetTop - frozen) > 2;
      if (!shell.classList.contains("is-typing") || pageChanged) {
        frozen = page ? page.offsetTop : root.scrollTop;
        if (pageChanged) root.scrollTop = frozen;
        innerFrozen.clear();
      }
      root.classList.add("is-typing");
      shell.classList.add("is-typing");
      holdPage();
      requestAnimationFrame(() => {
        holdPage();
        liftField(field);
      });
    };

    const onPointerDown = (e: Event) => {
      if (isField(e.target)) begin(e.target);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) begin(e.target);
    };
    const onFocusOut = () => {
      blurTimer = window.setTimeout(() => {
        if (isField(document.activeElement) && root.contains(document.activeElement)) return;
        root.classList.remove("is-typing");
        shell.classList.remove("is-typing");
        innerFrozen.clear();
        clearLifts();
      }, 140);
    };
    const onViewport = () => {
      holdPage();
      const active = document.activeElement;
      if (isField(active) && root.contains(active)) liftField(active);
    };

    root.addEventListener("pointerdown", onPointerDown, true);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    root.addEventListener("scroll", holdPage, true);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onViewport);
    vv?.addEventListener("scroll", onViewport);

    return () => {
      window.clearTimeout(blurTimer);
      root.removeEventListener("pointerdown", onPointerDown, true);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      root.removeEventListener("scroll", holdPage, true);
      vv?.removeEventListener("resize", onViewport);
      vv?.removeEventListener("scroll", onViewport);
      root.classList.remove("is-typing");
      shell.classList.remove("is-typing");
      clearLifts();
    };
  }, [phase]);

  const finish = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setPhase("open");
  }, []);

  const openInvite = useCallback(() => {
    if (record || phase !== "gate") return;
    const video = introVideo;
    if (reduced || !video) {
      setPhase("open");
      return;
    }
    const el = videoRef.current;
    if (!el) {
      setPhase("open");
      return;
    }
    setPhase("video");
    el.muted = Boolean(intro?.videoMuted);
    if (el.getAttribute("src") !== video) {
      el.src = video;
    }
    el.currentTime = 0;
    const play = el.play();
    play?.catch(() => {
      el.muted = true;
      el.play().catch(() => setPhase("open"));
    });
  }, [record, phase, introVideo, intro?.videoMuted, reduced]);

  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (musicOn) {
      a.pause();
      setMusicOn(false);
      return;
    }
    a.volume = stage.music?.volume ?? 0.6;
    a.play()
      .then(() => setMusicOn(true))
      .catch(() => setMusicOn(false));
  };

  const goNext = (from: HTMLElement) => {
    const root = scrollRef.current;
    const page = from.closest(".stg-page");
    const next = page?.nextElementSibling as HTMLElement | null;
    if (!root || !next) return;
    root.scrollTo({ top: next.offsetTop, behavior: reduced ? "auto" : "smooth" });
  };

  const onAction = (el: StageElement, node: HTMLElement) => {
    const action = el.action;
    if (action === "open") openInvite();
    else if (action === "nextPage") goNext(node);
    else if (action === "calendar") {
      const start = values.f_mainDate;
      if (!start) return;
      const d = new Date(start);
      const stamp = d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const end = new Date(d.getTime() + 4 * 3600000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${stamp}\nDTEND:${end}\nSUMMARY:${stage.title || (en ? "Invitation" : "Davet")}\nLOCATION:${values.f_venueName || ""}\nEND:VEVENT\nEND:VCALENDAR`;
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "davet.ics";
      a.click();
      URL.revokeObjectURL(url);
    } else if (action === "directions") {
      const place = (el.fieldId ? stage.places?.[el.fieldId] : undefined) || stage.places?.f_venue;
      const q = place?.query || values.f_venueName || values.f_address || "";
      if (place?.lat != null && place.lng != null) window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`, "_blank", "noopener");
      else if (q) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, "_blank", "noopener");
    } else if (action === "copy") {
      const text = (el.fieldId ? values[el.fieldId] : "") || values.f_iban || "";
      if (text) navigator.clipboard?.writeText(text).catch(() => undefined);
    } else if (action === "lens") {
      node.querySelector("input")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  };

  const stageRef = useRef<HTMLDivElement>(null);
  const gateCount = intro?.gate ? 1 : 0;

  useEffect(() => {
    if (!record) return;
    setPhase(shot < gateCount ? "gate" : "open");
  }, [record, shot, gateCount]);

  useEffect(() => {
    if (!record || phase !== "open") return;
    const root = scrollRef.current;
    const page = root?.querySelectorAll(".stg-page")[shot - gateCount] as HTMLElement | undefined;
    if (root && page) root.scrollTop = page.offsetTop;
  }, [record, phase, shot, gateCount]);

  useEffect(() => {
    if (!record) return;
    const api = {
      ready: true as const,
      count: gateCount + pages.length,
      gate: gateCount,
      show: (index: number) => setShot(index),
      stage: () => stageRef.current,
    };
    (window as Window & { __kayit?: typeof api }).__kayit = api;
    return () => {
      delete (window as Window & { __kayit?: typeof api }).__kayit;
    };
  }, [record, gateCount, pages.length]);
  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const reach = contentReach(design);
    const apply = () => {
      const viewW = node.clientWidth;
      const viewH = node.clientHeight;
      if (!viewW || !viewH) return;
      const contain = Math.min(viewW / canvasW, viewH / canvasH);
      const widthFill = viewW / canvasW;
      const cover = Math.max(viewW / canvasW, viewH / canvasH);
      const fitContent = viewH / (2 * reach);
      let scale = Math.max(contain, Math.min(widthFill, fitContent));
      const phone = viewW <= 600 && viewH >= viewW;
      if (phone && canvasH * scale < viewH - 1) scale = Math.max(scale, cover);
      node.style.setProperty("--stg-art-w", `${(canvasW * scale).toFixed(2)}px`);
      node.style.setProperty("--stg-art-h", `${(canvasH * scale).toFixed(2)}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, [design, canvasW, canvasH]);

  const fontCss = (stage.fonts || [])
    .map((f) => {
      const weight = f.minWeight === f.maxWeight ? String(f.minWeight) : `${f.minWeight} ${f.maxWeight}`;
      return `@font-face{font-family:"${f.family.replace(/"/g, "")}";src:url("${f.url}") format("woff2");font-weight:${weight};font-display:swap}`;
    })
    .join("");

  const bgImage = design.background?.image;
  const gateImage = (en && intro?.neutralPoster ? intro.neutralPoster : intro?.poster) || bgImage;
  const warmImages = useMemo(() => {
    const srcs: string[] = [];
    const add = (src?: string) => {
      if (src && !srcs.includes(src)) srcs.push(src);
    };
    add(gateImage);
    add(bgImage);
    for (const el of pages[0]?.elements || []) {
      if (!el.hidden && el.type === "image" && el.src) add(el.src);
    }
    return srcs.slice(0, 3);
  }, [gateImage, bgImage, pages]);

  return (
      <div className="iv stg-root" data-embed={embed ? "1" : undefined} data-kayit={record ? "1" : undefined} data-slug={slug} style={{ ["--stg-desk" as string]: desk }}>
      <p className={photoNote ? `iv-status iv-status--${photoNote.ok ? "ok" : "err"}` : "sr-only"} role="status" aria-live="polite">{photoNote?.text}</p>
      <style>{fontCss}</style>
      {(stage.fonts || []).map((f) => (
        <link key={f.url} rel="preload" href={f.url} as="font" type="font/woff2" crossOrigin="anonymous" />
      ))}
      {warmImages.map((src) => (
        <link key={src} rel="preload" href={src} as="image" fetchPriority="high" />
      ))}
      <div className="iv__stage">
        <div
          ref={stageRef}
          className={phase === "open" ? "stg" : "stg is-intro"}
          style={{ ["--stg-ratio" as string]: String(canvasW / canvasH), ["--stg-desk" as string]: desk, ["--stg-chrome" as string]: design.chrome?.color || "#fff", ["--stg-chrome-bg" as string]: design.chrome?.background || "#00000059" }}
          data-flow="snap"
          data-phase={phase}
        >
          {phase === "open" && bgImage ? (
            <div className="stg-fit stg-bg" aria-hidden="true">
              <img className="stg-media stg-media--screen" src={bgImage} alt="" draggable={false} decoding="async" fetchPriority="high" />
            </div>
          ) : null}
          {phase === "open" ? (
          <div ref={scrollRef} className="stg-pages">
            {pages.map((page, pageIndex) => (
              <section key={page.id} className={`stg-page${(record ? pageIndex === shot - gateCount : pageIndex === 0) ? " is-in" : ""}`} id={`sayfa-${page.id}`} aria-label={stageLabel(page.name, locale)}>
                <div className="stg-fit">
                  <div className="stg-art">
                    {(page.kind === "gift" ? (page.elements || []).filter((el) => !el.hidden && keepGiftChrome(el, page.elements || [])) : (page.elements || []).filter((el) => !el.hidden)).map((el) => (
                      <Element
                        key={el.id}
                        el={el}
                        canvasW={canvasW}
                        values={values}
                        lists={lists}
                        places={stage.places || {}}
                        wishes={wishes}
                        photos={photos}
                        rsvpDone={rsvpDone}
                        wishDone={wishDone}
                        onAddPhoto={addShot}
                        onRsvp={() => setRsvpDone(true)}
                        onWish={(name, text) => {
                          const cleanName = name.trim();
                          const cleanText = text.trim();
                          if (cleanName.length < 2 || cleanText.length < 3) return;
                          setWishes((w) => [...w, { name: cleanName, text: cleanText }]);
                          setWishDone(true);
                        }}
                        onAction={onAction}
                        locale={locale}
                        eager={record || pageIndex === 0}
                      />
                    ))}
                    {page.kind === "gift" ? (() => {
                      const palette = giftPalette(page.elements || []);
                      return (
                        <GiftBox
                          holder={values.f_ibanOwner || ""}
                          iban={values.f_iban || ""}
                          accent={palette.accent}
                          ink={palette.ink}
                          label={palette.label}
                          locale={locale}
                        />
                      );
                    })() : null}
                  </div>
                </div>
              </section>
            ))}
          </div>
          ) : null}

          {phase !== "open" && (
            <div className={`stg-intro${phase === "gate" ? " is-in" : " is-leaving"}`} onClick={(e) => {
              if ((e.target as HTMLElement).closest("[data-action]")) return;
              openInvite();
            }}>
              <div className="stg-fit">
                <div style={{ position: "absolute", inset: 0, background: intro?.videoBackground || desk }} />
                {gateImage ? <img className="stg-media stg-media--screen" src={gateImage} alt="" draggable={false} decoding="async" fetchPriority="high" /> : null}
                <div className="stg-art">
                  {(intro?.gate?.elements || []).filter((el) => !el.hidden).map((el) => (
                    <Element key={el.id} el={el} canvasW={canvasW} values={values} lists={{}} places={{}} wishes={[]} photos={[]} rsvpDone={false} wishDone={false} onAddPhoto={() => undefined} onRsvp={() => undefined} onWish={() => undefined} onAction={onAction} locale={locale} eager />
                  ))}
                </div>
              </div>
            </div>
          )}

          {introVideo ? (
            <video
              ref={videoRef}
              className="stg-video"
              playsInline
              preload="none"
              muted={Boolean(intro?.videoMuted)}
              style={{ opacity: phase === "video" ? 1 : 0, pointerEvents: phase === "video" ? "auto" : "none" }}
              onEnded={finish}
              onError={finish}
            />
          ) : null}

          {phase === "video" && intro?.skippable !== false && (
            <button type="button" className="stg-skip" onClick={finish}>
              {intro?.skipLabel || (en ? "Skip" : "Geç")}
            </button>
          )}

          {record ? null : (
            <div className="stg-wm" aria-hidden="true">
              {en ? "PREVIEW · PREVIEW · PREVIEW" : "ÖNİZLEME · ÖNİZLEME · ÖNİZLEME"}
            </div>
          )}

          {stage.music?.src && !record ? (
            <>
              <audio ref={audioRef} src={stage.music.src} loop={stage.music.loop !== false} preload="none" />
              <button type="button" className="stg-chrome stg-chrome--right" aria-pressed={musicOn} aria-label={en ? "Turn music on or off" : "Müziği aç/kapat"} onClick={toggleMusic}>
                <StageIcon name={musicOn ? "volume" : "music"} size={1.1} />
              </button>
            </>
          ) : null}

        </div>
      </div>
    </div>
  );
}

function StageList({
  el,
  canvasW,
  rows,
}: {
  el: StageElement;
  canvasW: number;
  rows: Array<Record<string, string>>;
}) {
  const list = el.list || {};
  const layout = list.layout === "cards" || list.layout === "alternate" || list.layout === "steps" ? list.layout : "timeline";
  const marker = list.markerSize || 24;
  const cells = (row: Record<string, string>) => (
    <>
      {row.time ? <span className="stg-list__cell" style={textCss(list.styles?.time || el.style, canvasW)}>{row.time}</span> : null}
      {row.title ? <span className="stg-list__cell" style={textCss(list.styles?.title || el.style, canvasW)}>{row.title}</span> : null}
      {row.note ? <span className="stg-list__cell" style={textCss(list.styles?.note || el.style, canvasW)}>{row.note}</span> : null}
    </>
  );
  return (
    <div className={`stg-list stg-list--${layout}`}>
      <div
        className="stg-list__grid"
        data-marker={list.markerShape || "dot"}
        data-hollow={list.markerFilled === false ? "" : undefined}
        style={{
          gridTemplateColumns: layout === "alternate" || layout === "cards" ? undefined : "1fr",
          gap: cq(list.itemGap ?? 18, canvasW),
          ["--gap" as string]: cq(list.itemGap ?? 18, canvasW),
          ["--mk" as string]: cq(marker, canvasW),
          ["--mc" as string]: cq(marker / 2, canvasW),
          ["--rail" as string]: cq(marker + 14, canvasW),
          ["--mk-color" as string]: list.markerColor || "#dc690c",
          ["--mk-text" as string]: list.markerTextColor || "#fff",
          ["--mk-font" as string]: fontStack("Cinzel Decorative"),
          ["--lc" as string]: list.lineColor || "#db955bb3",
          ["--lw" as string]: cq(list.lineWidth || 1, canvasW),
          ["--card-r" as string]: cq(list.cardRadius || 12, canvasW),
          ["--card-p" as string]: cq(list.cardPadding || 14, canvasW),
        }}
      >
        {rows.map((row, i) => (
          <div key={i} className="stg-list__item">
            {layout === "alternate" ? (
              <>
                <div className={`stg-list__side ${i % 2 === 0 ? "is-left" : "is-right"}`}>{cells(row)}</div>
                {i % 2 === 1 ? <div className="stg-list__side is-left" /> : <div className="stg-list__side is-right" />}
                <span className="stg-list__marker" aria-hidden="true"><b>{i + 1}</b></span>
              </>
            ) : layout === "cards" ? (
              cells(row)
            ) : (
              <>
                <span className="stg-list__marker" aria-hidden="true"><b>{i + 1}</b></span>
                <div className="stg-list__content">{cells(row)}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Element({
  el,
  canvasW,
  values,
  lists,
  places,
  wishes,
  photos,
  rsvpDone,
  wishDone,
  onAddPhoto,
  onRsvp,
  onWish,
  onAction,
  locale,
  eager = false,
}: {
  el: StageElement;
  canvasW: number;
  values: Record<string, string>;
  lists: Record<string, Array<Record<string, string>>>;
  places: Record<string, { query?: string; lat?: number; lng?: number }>;
  wishes: Array<{ name?: string; text?: string }>;
  photos: Shot[];
  rsvpDone: boolean;
  wishDone: boolean;
  onAddPhoto: (file: File, source: "wall" | "lens") => void;
  onRsvp: () => void;
  onWish: (name: string, text: string) => void;
  onAction: (el: StageElement, node: HTMLElement) => void;
  locale: Locale;
  eager?: boolean;
}) {
  const style = boxStyle(el, canvasW);
  const anim = el.anim?.kind
    ? ({ ["--anim-delay" as string]: `${el.anim.delay || 0}ms`, ["--anim-dur" as string]: `${el.anim.duration || 800}ms` } as CSSProperties)
    : undefined;

  let body: ReactNode = null;
  if (el.type === "text" || el.type === "field") {
    const raw = el.type === "field" && el.fieldId ? values[el.fieldId] || "" : el.text || "";
    body = <TextBlock el={el} canvasW={canvasW} value={el.type === "field" ? formatField(raw, el.format, locale) : raw} />;
  } else if (el.type === "image" && el.src) {
    body = (
      <img
        className={`stg-media${el.imageFit === "contain" ? "" : " stg-media--screen"}`}
        src={el.src}
        alt=""
        draggable={false}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "low"}
        style={{ objectFit: el.imageFit === "contain" ? "contain" : el.imageFit === "cover" ? "cover" : "fill", objectPosition: `${el.focusX ?? 50}% ${el.focusY ?? 50}%`, borderRadius: "inherit" }}
      />
    );
  } else if (el.type === "shape") {
    body = (
      <div
        className="stg-shape"
        style={{
          background: el.fill || "transparent",
          border: el.strokeWidth ? `${cq(el.strokeWidth, canvasW)} solid ${el.stroke || "transparent"}` : undefined,
          borderRadius: "inherit",
          boxShadow: shadowOf(el, canvasW),
        }}
      />
    );
  } else if (el.type === "line") {
    body = (
      <div className="stg-line">
        <span className="stg-line__stroke" style={{ height: cq(Math.max(el.strokeWidth || 1, 1), canvasW), background: el.stroke || "currentColor", borderRadius: 99 }} />
      </div>
    );
  } else if (el.type === "icon") {
    body = (
      <div className="stg-ico-wrap" style={{ color: el.stroke || el.style?.color || "currentColor" }}>
        <StageIcon name={el.icon} anim={el.button?.iconAnim} speed={el.button?.iconAnimSpeed} strokeWidth={el.strokeWidth || 1.1} />
      </div>
    );
  } else if (el.type === "button") {
    const b = el.button || {};
    const fill = el.fill || b.fill || "#8a6d4b";
    const fillTo = b.fillTo;
    body = (
      <button
        type="button"
        className="stg-btn"
        data-action={el.action || undefined}
        aria-label={el.text || stageLabel(el.name, locale) || el.action}
        onClick={(e) => {
          e.stopPropagation();
          onAction(el, e.currentTarget);
        }}
        style={{
          ...textCss(b.text || el.style, canvasW),
          fontFamily: fontStack(b.text?.font || el.style?.font || "Jost"),
          background: fillTo ? `linear-gradient(${b.gradientAngle || 160}deg, ${fill}, ${fillTo})` : fill,
          border: el.strokeWidth ? `${cq(el.strokeWidth, canvasW)} solid ${el.stroke || "transparent"}` : "0",
          borderRadius: "inherit",
          boxShadow: shadowOf(el, canvasW),
          color: el.style?.color || "#fff",
        }}
      >
        {el.action === "lens" && <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(e) => {
          const file = e.target.files?.[0];
          e.currentTarget.value = "";
          if (file) onAddPhoto(file, "lens");
        }} />}
        <StageIcon name={el.icon || b.icon} anim={b.iconAnim} speed={b.iconAnimSpeed} size={b.iconSize || 1.35} />
        {el.text ? <span className="stg-btn__label">{el.text}</span> : null}
      </button>
    );
  } else if (el.type === "countdown") {
    body = <Countdown el={el} canvasW={canvasW} iso={values.f_mainDate} locale={locale} />;
  } else if (el.type === "list") {
    body = <StageList el={el} canvasW={canvasW} rows={(el.fieldId ? lists[el.fieldId] : undefined) || []} />;
  } else if (el.type === "map") {
    const place = (el.fieldId ? places[el.fieldId] : undefined) || places.f_venue;
    const q = place?.query || values.f_venueName || "";
    const zoom = el.zoom || 15;
    const src =
      place?.lat != null && place.lng != null
        ? `https://maps.google.com/maps?q=${place.lat},${place.lng}&z=${zoom}&output=embed`
        : q
          ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`
          : "";
    body = (
      <div className="stg-map" style={{ borderRadius: el.clipShape === "ellipse" ? "50%" : undefined }}>
        {src ? <iframe title={q || (locale === "en" ? "Map" : "Harita")} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <span className="stg-text" style={textCss(el.style, canvasW)}>{q}</span>}
      </div>
    );
  } else if (el.type === "form") {
    body = <RsvpForm el={el} canvasW={canvasW} done={rsvpDone} onDone={onRsvp} locale={locale} />;
  } else if (el.type === "messages") {
    body = <WishWall el={el} canvasW={canvasW} wishes={wishes} done={wishDone} onWish={onWish} locale={locale} />;
  } else if (el.type === "memoryWall") {
    body = (
      <div className="stg-memory" style={{ color: el.style?.color }}>
        {el.hint ? <p style={{ ...textCss(el.style, canvasW), position: "relative", marginBottom: 8 }}>{el.hint}</p> : null}
        <div className="stg-gallery">
          {photos.map((shot) => (
            <img key={shot.id} src={shot.url} alt="" />
          ))}
        </div>
        <label className="stg-btn" style={{ position: "relative", marginTop: 8, background: el.button?.fill || "#dc690c", color: "#fff", borderRadius: 10, minHeight: 38 }}>
          <StageIcon name={el.button?.icon || "camera"} size={1.1} />
          <span>{el.text || (locale === "en" ? "Upload a photo" : "Fotoğraf Yükle")}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              if (file) onAddPhoto(file, "wall");
            }}
          />
        </label>
      </div>
    );
  }

  if (!body) return null;
  return (
    <div className="stg-el" style={style}>
      <div className="stg-inner" data-anim={el.anim?.kind || undefined} style={anim}>
        {body}
      </div>
    </div>
  );
}

function formVars(el: StageElement, canvasW: number): CSSProperties {
  const s = el.form?.style || {};
  return {
    fontFamily: fontStack(s.font || "Jost"),
    fontSize: cq(s.size || 12, canvasW),
    ["--f-label" as string]: s.labelColor || "#e2ab7e",
    ["--f-bg" as string]: s.inputBackground || "#ffffff14",
    ["--f-color" as string]: s.inputColor || "#e4b086",
    ["--f-border" as string]: s.inputBorder || "#db955b99",
    ["--f-radius" as string]: cq(s.radius || 10, canvasW),
    ["--f-btn-bg" as string]: s.buttonBackground || "#dc690c",
    ["--f-btn-color" as string]: s.buttonColor || "#fff",
    ["--f-gap" as string]: cq(s.gap || 7, canvasW),
    ["--f-accent" as string]: s.accentColor || s.buttonBackground || "#dc690c",
    ["--f-bw" as string]: cq(s.borderWidth || 1, canvasW),
    ["--f-label-size" as string]: `${s.labelSize || 0.74}em`,
    ["--f-label-font" as string]: fontStack(s.labelFont || s.font || "Jost"),
    ["--f-ph" as string]: s.placeholderColor || "#e4b08680",
    background: s.panelFill,
    border: s.panelStroke ? `${cq(s.borderWidth || 1, canvasW)} solid ${s.panelStroke}` : undefined,
    borderRadius: s.panelRadius ? cq(s.panelRadius, canvasW) : undefined,
    padding: s.panelPadding ? cq(s.panelPadding, canvasW) : undefined,
    gap: cq(s.gap || 7, canvasW),
  };
}

function attendingChoice(form: NonNullable<StageElement["form"]>) {
  const question = (form.questions || []).find((item) => item.type === "attendance");
  return question?.options?.[0] || "Katılıyorum";
}

function RsvpForm({ el, canvasW, done, onDone, locale }: { el: StageElement; canvasW: number; done: boolean; onDone: () => void; locale: Locale }) {
  const form = el.form || {};
  const s = form.style || {};
  const en = locale === "en";
  const yes = attendingChoice(form);
  const [attend, setAttend] = useState(yes);
  const [guests, setGuests] = useState(1);
  if (done) {
    return <p className="stg-form__success" style={textCss(el.style, canvasW)}>{form.successText || (en ? "Thank you for your reply!" : "Yanıtınız için teşekkür ederiz!")}</p>;
  }
  return (
    <form
      className="stg-form has-panel"
      data-look={s.look || "filled"}
      data-label-caps={s.labelCaps === false ? undefined : ""}
      style={formVars(el, canvasW)}
      onSubmit={(e) => {
        e.preventDefault();
        onDone();
      }}
    >
      {(form.questions || []).map((q) => {
        if (q.onlyIfAttending && attend !== yes) return null;
        if (q.type === "attendance") {
          return (
            <div key={q.id} className="stg-form__row">
              <span className="stg-form__label">{q.label}{q.required ? " *" : ""}</span>
              <div className="stg-form__options">
                {(q.options || []).map((opt: string) => (
                  <label key={opt} className="stg-form__option">
                    <input type="radio" name={q.id} checked={attend === opt} onChange={() => setAttend(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          );
        }
        if (q.type === "guests") {
          const min = q.min || 1;
          const max = q.max || 10;
          return (
            <div key={q.id} className="stg-form__row">
              <span className="stg-form__label">{q.label}{q.required ? " *" : ""}</span>
              <div className="stg-stepper">
                <button type="button" className="stg-stepper__btn" aria-label="-1" onClick={() => setGuests((n) => Math.max(min, n - 1))}>−</button>
                <input className="stg-form__input" readOnly value={guests} aria-label={q.label} />
                <button type="button" className="stg-stepper__btn" aria-label="+1" onClick={() => setGuests((n) => Math.min(max, n + 1))}>+</button>
              </div>
            </div>
          );
        }
        return (
          <label key={q.id} className="stg-form__row">
            <span className="stg-form__label">{q.label}{q.required ? " *" : ""}</span>
            <input className="stg-form__input" required={q.required} placeholder={q.placeholder} maxLength={q.max} />
          </label>
        );
      })}
      <button type="submit" className="stg-form__submit">
        <StageIcon name="envelope" size={1.05} strokeWidth={1.6} />
        {form.submitLabel || (en ? "Send" : "Gönder")}
      </button>
    </form>
  );
}

function WishWall({
  el,
  canvasW,
  wishes,
  done,
  onWish,
  locale,
}: {
  el: StageElement;
  canvasW: number;
  wishes: Array<{ name?: string; text?: string }>;
  done: boolean;
  onWish: (name: string, text: string) => void;
  locale: Locale;
}) {
  const en = locale === "en";
  const listRef = useRef<HTMLUListElement>(null);
  const stickToEnd = useRef(false);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (!stickToEnd.current) return;
    stickToEnd.current = false;
    list.scrollTop = list.scrollHeight;
  }, [wishes.length]);
  return (
    <div className="stg-messages">
      <ul ref={listRef} className="stg-messages__list">
        {wishes.map((w, i) => (
          <li key={`${w.name || "wish"}-${i}`} className="stg-messages__item" style={textCss(el.style, canvasW)}>
            <strong>{w.name}</strong>
            <p>{w.text}</p>
          </li>
        ))}
      </ul>
      {done ? (
        <p className="stg-messages__note" role="status" style={textCss(el.style, canvasW)}>
          {en ? "Your wish was added. Thank you!" : "Dileğiniz iletildi, teşekkür ederiz!"}
        </p>
      ) : null}
      <form
        className="stg-form has-panel"
        data-look="filled"
        style={formVars(el, canvasW)}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const name = String(data.get("name") || "");
          const text = String(data.get("text") || "");
          if (name.trim().length < 2 || text.trim().length < 3) return;
          stickToEnd.current = true;
          onWish(name, text);
          e.currentTarget.reset();
        }}
      >
        <input className="stg-form__input" name="name" required minLength={2} placeholder={el.hint || (en ? "Your name" : "Adınız")} aria-label={en ? "Your name" : "Adınız"} autoComplete="name" />
        <textarea className="stg-form__input" name="text" required minLength={3} maxLength={300} placeholder={en ? "Your wish" : "Dileğiniz"} rows={2} aria-label={en ? "Your wish" : "Dileğiniz"} />
        <button type="submit" className="stg-form__submit">
          {el.form?.submitLabel || (en ? "Send my wish" : "Dileğimi Gönder")}
        </button>
      </form>
    </div>
  );
}

function usePrefersReduced() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
