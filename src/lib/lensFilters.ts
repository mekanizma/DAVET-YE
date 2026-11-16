export type LensFilterId = "classic" | "rose" | "noir" | "glow" | "vintage";

export const LENS_FILTERS: Array<{
  id: LensFilterId;
  tr: string;
  en: string;
  css: string;
  /** Canvas 2D filter string applied when snapping. */
  canvas: string;
}> = [
  { id: "classic", tr: "Klasik altın", en: "Classic gold", css: "none", canvas: "none" },
  { id: "rose", tr: "Gül ışığı", en: "Rose light", css: "sepia(0.18) saturate(1.15) hue-rotate(-12deg)", canvas: "sepia(0.18) saturate(1.15) hue-rotate(-12deg)" },
  { id: "noir", tr: "Siyah-beyaz", en: "Noir", css: "grayscale(1) contrast(1.08)", canvas: "grayscale(1) contrast(1.08)" },
  { id: "glow", tr: "Yumuşak parıltı", en: "Soft glow", css: "brightness(1.08) contrast(0.95) saturate(1.1)", canvas: "brightness(1.08) contrast(0.95) saturate(1.1)" },
  { id: "vintage", tr: "Vintage film", en: "Vintage film", css: "sepia(0.35) contrast(1.05) brightness(0.98)", canvas: "sepia(0.35) contrast(1.05) brightness(0.98)" },
];

export function lensFilter(id: string | undefined | null) {
  return LENS_FILTERS.find((f) => f.id === id) || LENS_FILTERS[0];
}
