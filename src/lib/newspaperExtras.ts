import type { NewspaperComponentItem } from "@/data/newspaperComponents";

export type NewspaperExtra = {
  id: string;
  pageId: string;
  componentId: string;
  kind: NewspaperComponentItem["kind"];
  x: number;
  y: number;
  w: number;
  h: number;
  /** For icons */
  icon?: string;
  stroke?: string;
  strokeWidth?: number;
  /** For shapes */
  fill?: string;
  radius?: number;
  /** For text */
  text?: string;
  font?: string;
  size?: number;
  weight?: number;
  italic?: boolean;
  color?: string;
  letterSpacing?: number;
  transform?: string;
  /** For images */
  src?: string;
};

type StageEl = Record<string, unknown> & {
  id?: string;
  type?: string;
  elements?: StageEl[];
};

type StagePage = {
  id?: string;
  name?: string;
  elements?: StageEl[];
};

function baseEl(extra: Partial<StageEl> = {}): StageEl {
  return {
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    scope: "always",
    cells: false,
    fit: "none",
    stretch: false,
    textColumns: 1,
    columnGap: 18,
    strokeWidth: 0,
    dash: "solid",
    radius: 0,
    imageFit: "cover",
    mask: "none",
    focusX: 50,
    focusY: 50,
    scale: 1,
    shape: "rect",
    zoom: 15,
    grayscale: false,
    action: "none",
    bleed: false,
    columns: 3,
    gap: 6,
    photoStyle: "grid",
    uploadStyle: "button",
    loop: true,
    muted: true,
    controls: false,
    soundOff: false,
    autoplay: true,
    ...extra,
  };
}

export function createExtraId() {
  return `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function extraFromComponent(
  item: NewspaperComponentItem,
  pageId: string,
  canvas = { width: 800, height: 1131 },
): NewspaperExtra {
  const d = item.defaults || {};
  const w = Number(d.w) || (item.kind === "text" ? 280 : item.kind === "line" ? 320 : 120);
  const h = Number(d.h) || (item.kind === "text" ? 40 : item.kind === "line" ? 4 : 120);
  const x = Math.round((canvas.width - w) / 2 + (Math.random() * 40 - 20));
  const y = Math.round(canvas.height * 0.35 + (Math.random() * 80 - 40));

  const base: NewspaperExtra = {
    id: createExtraId(),
    pageId,
    componentId: item.id,
    kind: item.kind,
    x: Math.max(12, Math.min(canvas.width - w - 12, x)),
    y: Math.max(12, Math.min(canvas.height - h - 12, y)),
    w,
    h,
  };

  if (item.kind === "icon") {
    return {
      ...base,
      icon: String(d.icon || "sparkle"),
      stroke: String(d.stroke || "#e8c778"),
      strokeWidth: Number(d.strokeWidth) || 1.4,
    };
  }
  if (item.kind === "shape") {
    return {
      ...base,
      fill: d.fill === "transparent" ? "transparent" : String(d.fill || "#1a1510"),
      radius: Number(d.radius) || 0,
      stroke: d.stroke ? String(d.stroke) : undefined,
      strokeWidth: d.strokeWidth != null ? Number(d.strokeWidth) : undefined,
    };
  }
  if (item.kind === "line") {
    return {
      ...base,
      stroke: String(d.stroke || "#e8c778"),
      strokeWidth: Number(d.strokeWidth) || 1.5,
      h: Math.max(2, Number(d.h) || 4),
    };
  }
  if (item.kind === "text") {
    return {
      ...base,
      text: String(d.text || "Yeni metin"),
      font: String(d.font || "Spectral"),
      size: Number(d.size) || 18,
      weight: Number(d.weight) || 500,
      italic: Boolean(d.italic),
      color: String(d.color || "#f7efd8"),
      letterSpacing: d.letterSpacing != null ? Number(d.letterSpacing) : 0,
      transform: d.transform ? String(d.transform) : "none",
      w: Math.max(120, Math.min(520, String(d.text || "Yeni metin").length * (Number(d.size) || 18) * 0.55)),
      h: Math.max(28, (Number(d.size) || 18) * 1.6),
    };
  }
  return {
    ...base,
    src: String(d.src || ""),
  };
}

export function extraToElement(extra: NewspaperExtra): StageEl {
  if (extra.kind === "icon") {
    return baseEl({
      id: extra.id,
      type: "icon",
      name: "Bileşen",
      x: extra.x,
      y: extra.y,
      w: extra.w,
      h: extra.h,
      edit: "locked",
      icon: extra.icon || "sparkle",
      stroke: extra.stroke || "#e8c778",
      strokeWidth: extra.strokeWidth ?? 1.4,
    });
  }
  if (extra.kind === "shape") {
    return baseEl({
      id: extra.id,
      type: "shape",
      name: "Şekil",
      x: extra.x,
      y: extra.y,
      w: extra.w,
      h: extra.h,
      edit: "locked",
      fill: extra.fill && extra.fill !== "transparent" ? extra.fill : "#00000000",
      radius: extra.radius || 0,
      stroke: extra.stroke,
      strokeWidth: extra.strokeWidth ?? (extra.stroke ? 2 : 0),
    });
  }
  if (extra.kind === "line") {
    return baseEl({
      id: extra.id,
      type: "line",
      name: "Çizgi",
      x: extra.x,
      y: extra.y,
      w: extra.w,
      h: extra.h,
      edit: "locked",
      stroke: extra.stroke || "#e8c778",
      strokeWidth: extra.strokeWidth ?? 1.5,
    });
  }
  if (extra.kind === "text") {
    return baseEl({
      id: extra.id,
      type: "text",
      name: "Metin bileşeni",
      x: extra.x,
      y: extra.y,
      w: extra.w,
      h: extra.h,
      edit: "content",
      text: extra.text || "",
      fit: "shrink",
      stretch: true,
      minSize: 10,
      style: {
        font: extra.font || "Spectral",
        size: extra.size || 18,
        weight: extra.weight || 500,
        italic: Boolean(extra.italic),
        underline: false,
        color: extra.color || "#f7efd8",
        align: "center",
        vAlign: "middle",
        lineHeight: 1.2,
        letterSpacing: extra.letterSpacing || 0,
        transform: extra.transform || "none",
      },
    });
  }
  return baseEl({
    id: extra.id,
    type: "image",
    name: "Çıkartma",
    x: extra.x,
    y: extra.y,
    w: extra.w,
    h: extra.h,
    edit: "locked",
    src: extra.src || "",
    fill: "#2a2218",
    imageFit: "contain",
  });
}

export function injectExtrasIntoPages(pages: StagePage[], extras: NewspaperExtra[]): StagePage[] {
  if (!pages.length || !extras.length) return pages;
  const byPage = new Map<string, NewspaperExtra[]>();
  for (const ex of extras) {
    const list = byPage.get(ex.pageId) || [];
    list.push(ex);
    byPage.set(ex.pageId, list);
  }
  return pages.map((page, index) => {
    const pageId = page.id || `p${index + 1}`;
    const list = byPage.get(pageId) || byPage.get(`p:${index}`) || [];
    if (!list.length) return page;
    const els = [...(page.elements || [])];
    for (const ex of list) els.push(extraToElement(ex));
    return { ...page, elements: els };
  });
}

export function normalizeExtras(raw: unknown): NewspaperExtra[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      id: String(item.id || createExtraId()),
      pageId: String(item.pageId || "p1"),
      componentId: String(item.componentId || ""),
      kind: (["icon", "shape", "line", "text", "image"].includes(String(item.kind))
        ? item.kind
        : "icon") as NewspaperExtra["kind"],
      x: Number(item.x) || 40,
      y: Number(item.y) || 40,
      w: Number(item.w) || 80,
      h: Number(item.h) || 80,
      icon: item.icon ? String(item.icon) : undefined,
      stroke: item.stroke ? String(item.stroke) : undefined,
      strokeWidth: item.strokeWidth != null ? Number(item.strokeWidth) : undefined,
      fill: item.fill ? String(item.fill) : undefined,
      radius: item.radius != null ? Number(item.radius) : undefined,
      text: item.text != null ? String(item.text) : undefined,
      font: item.font ? String(item.font) : undefined,
      size: item.size != null ? Number(item.size) : undefined,
      weight: item.weight != null ? Number(item.weight) : undefined,
      italic: Boolean(item.italic),
      color: item.color ? String(item.color) : undefined,
      letterSpacing: item.letterSpacing != null ? Number(item.letterSpacing) : undefined,
      transform: item.transform ? String(item.transform) : undefined,
      src: item.src ? String(item.src) : undefined,
    }));
}
