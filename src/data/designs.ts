/**
 * KendinTasarla ready-made designs — synced from davetiyemgo.com (110 templates).
 */
import studioIndex from "@/data/studio-designs/index.json";

export type FrameKind = "none" | "single" | "double" | "ornate";
export type FontKind = "script" | "display" | "condensed" | "serif" | "body";

export interface Block {
  id: string;
  label: string;
  text: string;
  /** font-size in % of card width (cqw) */
  size: number;
  /** vertical centre of the block in % of card height */
  y: number;
  font: FontKind;
  tone: "ink" | "accent";
  color?: string;
  letterSpacing?: number;
  lineHeight?: number;
  /** left edge in % of card width */
  x?: number;
  /** box width in % of card width */
  w?: number;
  align?: "left" | "center" | "right";
  weight?: number | string | null;
}

export type DesignLayer =
  | {
      type: "shape";
      shape?: string;
      x: number;
      y: number;
      w: number;
      h: number;
      fill?: string;
      stroke?: string | null;
      strokeWidth?: number;
      radius?: number;
      opacity?: number;
      rotation?: number;
    }
  | {
      type: "line";
      x: number;
      y: number;
      w: number;
      h: number;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      rotation?: number;
    }
  | {
      type: "image";
      x: number;
      y: number;
      w: number;
      h: number;
      src: string;
      opacity?: number;
      rotation?: number;
    }
  | {
      type: "icon";
      x: number;
      y: number;
      w: number;
      h: number;
      icon?: string;
      stroke?: string;
      opacity?: number;
      rotation?: number;
    };

export interface DesignState {
  presetId: string;
  bg: string;
  bg2: string;
  ink: string;
  accent: string;
  frame: FrameKind;
  ratio: "story" | "square" | "portrait";
  cover?: string | null;
  layers?: DesignLayer[];
  blocks: Block[];
}

export interface DesignText {
  text: string;
  y: number;
  size: number;
  font: FontKind;
  color?: string | null;
  letterSpacing?: number;
  lineHeight?: number;
  x?: number;
  w?: number;
  align?: "left" | "center" | "right";
  weight?: number | string | null;
}

export interface DesignPreset {
  id: string;
  name: string;
  category: string;
  categoryKey?: string;
  featured?: boolean;
  bg: string;
  bg2: string;
  ink: string;
  accent: string;
  frame: FrameKind;
  cover?: string | null;
  /** default copy */
  top: string;
  names: string;
  date: string;
  place: string;
  texts?: DesignText[];
  layers?: DesignLayer[];
}

export const RATIOS = {
  story: { label: "Telefon (9:16)", w: 1080, h: 1920 },
  portrait: { label: "Baskı (5×7)", w: 1050, h: 1470 },
  square: { label: "Kare (1:1)", w: 1080, h: 1080 },
} as const;

export const FONT_LABELS: Record<FontKind, string> = {
  script: "El yazısı (Great Vibes)",
  display: "Başlık (Cinzel)",
  condensed: "Sıkı başlık (Bebas)",
  serif: "Zarif (Cormorant)",
  body: "Sade (Inter)",
};

export const DESIGN_CATEGORIES = (studioIndex.categories || []).map((c) => ({
  key: c.key,
  name: c.name,
}));

function pickLine(texts: DesignPreset["texts"], re: RegExp, fallback = "") {
  return texts?.find((t) => re.test(t.text))?.text || fallback;
}

function fromIndexItem(item: (typeof studioIndex.items)[number]): DesignPreset {
  const texts = (item.texts || []).map((t) => ({
    text: t.text,
    y: t.y,
    size: t.size,
    font: (t.font as FontKind) || "body",
    color: t.color || null,
    letterSpacing: typeof t.letterSpacing === "number" ? t.letterSpacing : 0,
    lineHeight: typeof t.lineHeight === "number" ? t.lineHeight : 1.25,
    x: typeof t.x === "number" ? t.x : undefined,
    w: typeof t.w === "number" ? t.w : undefined,
    align: (t.align as Block["align"]) || "center",
    weight: t.weight ?? null,
  }));
  const layers = ((item as { layers?: DesignLayer[] }).layers || []) as DesignLayer[];
  const names =
    texts
      .filter((t) => t.font === "script")
      .map((t) => t.text)
      .filter((t) => t !== "&")
      .slice(0, 2)
      .join(" & ") || pickLine(texts, /&/, "Elif & Kerem");
  return {
    id: item.id,
    name: item.name,
    category: item.categoryLabel || item.category,
    categoryKey: item.category,
    featured: item.featured,
    bg: item.bg,
    bg2: item.bg2,
    ink: item.ink,
    accent: item.accent,
    frame: item.cover || layers.length ? "none" : "single",
    cover: item.cover || null,
    layers,
    top: pickLine(texts, /DAVET|TÖREN|GECE|ŞÖLEN|PARTİ|GALA|MEVLİD|SÜNNET|NİŞAN|SÖZ|EVLEN/i, "DAVETLİSİNİZ"),
    names,
    date: pickLine(texts, /\d{4}|SAAT|EYLÜL|EKİM|HAZİRAN|MAYIS|NİSAN|TEMMUZ|AĞUSTOS|KASIM|ARALIK|OCAK|ŞUBAT|MART/i, ""),
    place: pickLine(texts, /İstanbul|Ankara|İzmir|Saray|Salon|Bahçe|Lokanta|Otel|Köşk|Davet/i, ""),
    texts,
  };
}

export const designPresets: DesignPreset[] = (studioIndex.items || []).map(fromIndexItem);

export function getPreset(id?: string | null): DesignPreset {
  return designPresets.find((p) => p.id === id) ?? designPresets[0];
}

export function stateFromPreset(p: DesignPreset, ratio: DesignState["ratio"] = "story"): DesignState {
  const blocks: Block[] =
    p.texts && p.texts.length
      ? p.texts.map((t, i) => ({
          id: `t${i}`,
          label: `Metin ${i + 1}`,
          text: t.text,
          size: t.size,
          y: t.y,
          font: t.font,
          tone: t.font === "display" || t.font === "body" ? "accent" : "ink",
          color: t.color || undefined,
          letterSpacing: t.letterSpacing ?? 0,
          lineHeight: t.lineHeight ?? 1.25,
          x: t.x,
          w: t.w,
          align: t.align || "center",
          weight: t.weight ?? null,
        }))
      : [
          { id: "top", label: "Üst başlık", text: p.top, size: 3.4, y: 22, font: "body", tone: "accent", letterSpacing: 0.12, lineHeight: 1.25 },
          { id: "names", label: "İsimler", text: p.names, size: 15, y: 40, font: "script", tone: "ink", letterSpacing: 0, lineHeight: 1.1 },
          { id: "date", label: "Tarih", text: p.date, size: 3.8, y: 64, font: "display", tone: "ink", letterSpacing: 0.08, lineHeight: 1.1 },
          { id: "place", label: "Mekân", text: p.place, size: 3.6, y: 74, font: "serif", tone: "ink", letterSpacing: 0, lineHeight: 1.25 },
        ];
  return {
    presetId: p.id,
    bg: p.bg,
    bg2: p.bg2,
    ink: p.ink,
    accent: p.accent,
    frame: p.frame,
    ratio,
    cover: p.cover || null,
    layers: p.layers || [],
    blocks,
  };
}

export function blankState(): DesignState {
  const s = stateFromPreset({
    id: "bos",
    name: "Boş sayfa",
    category: "Nişan & Düğün",
    bg: "#fbf9f4",
    bg2: "#f2eee4",
    ink: "#1b1b1b",
    accent: "#83592b",
    frame: "none",
    cover: null,
    top: "",
    names: "",
    date: "",
    place: "",
    texts: [],
  });
  return { ...s, presetId: "bos", cover: null, layers: [], blocks: s.blocks.map((b) => ({ ...b, text: "" })) };
}
