/** Per-newspaper times-reader chrome skins — distinct from original Go Post desk look. */

export type TimesSkin = {
  id: string;
  /** CSS background for the reader stage */
  background: string;
  /** Fallback solid for --tr-scene */
  sceneColor: string;
  accent: string;
  ink: string;
  muted: string;
  brandFont: string;
  titleFont: string;
  uiFont: string;
};

const FONTS = {
  fraunces: '"Fraunces DN", Fraunces, Georgia, serif',
  cormorant: '"Cormorant DN", "Cormorant Garamond", Georgia, serif',
  bodoni: '"Bodoni DN", "Bodoni Moda", Didot, serif',
  cinzel: '"Cinzel DN", Cinzel, "Times New Roman", serif',
  spectral: '"Spectral DN", Spectral, Georgia, serif',
  josefin: '"Josefin DN", "Josefin Sans", "Segoe UI", sans-serif',
  jost: '"Jost DN", Jost, "Segoe UI", sans-serif',
  lora: '"Lora DN", Lora, Georgia, serif',
  oswald: '"Oswald DN", Oswald, "Arial Narrow", sans-serif',
  playfair: '"Playfair DN", "Playfair Display", Georgia, serif',
} as const;

const SKINS: TimesSkin[] = [
  {
    id: "ink-slate",
    background:
      "radial-gradient(120% 90% at 50% 0%, #3d4a5c 0%, transparent 55%), linear-gradient(165deg, #1a222d 0%, #0e141b 55%, #182029 100%)",
    sceneColor: "#121820",
    accent: "#9eb6c9",
    ink: "#e8eef4",
    muted: "rgb(232 238 244 / .62)",
    brandFont: FONTS.fraunces,
    titleFont: FONTS.josefin,
    uiFont: FONTS.jost,
  },
  {
    id: "rose-atelier",
    background:
      "radial-gradient(100% 80% at 80% 10%, #6b3a48 0%, transparent 50%), linear-gradient(160deg, #2a171c 0%, #140c10 60%, #24141a 100%)",
    sceneColor: "#160e12",
    accent: "#d4a0ab",
    ink: "#f6ebe8",
    muted: "rgb(246 235 232 / .6)",
    brandFont: FONTS.playfair,
    titleFont: FONTS.cormorant,
    uiFont: FONTS.josefin,
  },
  {
    id: "olive-press",
    background:
      "radial-gradient(90% 70% at 20% 0%, #4a5338 0%, transparent 45%), linear-gradient(170deg, #1c2116 0%, #0f120c 55%, #1a1f14 100%)",
    sceneColor: "#11150d",
    accent: "#b7c28a",
    ink: "#eef0e4",
    muted: "rgb(238 240 228 / .6)",
    brandFont: FONTS.spectral,
    titleFont: FONTS.lora,
    uiFont: FONTS.jost,
  },
  {
    id: "navy-folio",
    background:
      "radial-gradient(110% 85% at 50% 100%, #1e3a5f 0%, transparent 50%), linear-gradient(180deg, #0b1524 0%, #060b14 100%)",
    sceneColor: "#070d16",
    accent: "#7ea0c8",
    ink: "#e6eef8",
    muted: "rgb(230 238 248 / .58)",
    brandFont: FONTS.bodoni,
    titleFont: FONTS.cinzel,
    uiFont: FONTS.josefin,
  },
  {
    id: "copper-room",
    background:
      "radial-gradient(100% 80% at 0% 100%, #6a4024 0%, transparent 45%), linear-gradient(155deg, #24170f 0%, #120c08 60%, #1f1410 100%)",
    sceneColor: "#140e0a",
    accent: "#d0a074",
    ink: "#f3ebe1",
    muted: "rgb(243 235 225 / .6)",
    brandFont: FONTS.cormorant,
    titleFont: FONTS.fraunces,
    uiFont: FONTS.lora,
  },
  {
    id: "plum-salon",
    background:
      "radial-gradient(95% 75% at 100% 50%, #4a2a55 0%, transparent 50%), linear-gradient(165deg, #1a1020 0%, #0c0812 100%)",
    sceneColor: "#0d0812",
    accent: "#c4a0d4",
    ink: "#f2e8f6",
    muted: "rgb(242 232 246 / .58)",
    brandFont: FONTS.playfair,
    titleFont: FONTS.spectral,
    uiFont: FONTS.jost,
  },
  {
    id: "sea-glass",
    background:
      "radial-gradient(100% 80% at 50% 0%, #2f5a58 0%, transparent 50%), linear-gradient(170deg, #10201f 0%, #071211 55%, #132422 100%)",
    sceneColor: "#0a1514",
    accent: "#8fc4bf",
    ink: "#e5f3f1",
    muted: "rgb(229 243 241 / .6)",
    brandFont: FONTS.fraunces,
    titleFont: FONTS.josefin,
    uiFont: FONTS.spectral,
  },
  {
    id: "charcoal-type",
    background:
      "repeating-linear-gradient(90deg, rgb(255 255 255 / .03) 0 1px, transparent 1px 18px), linear-gradient(180deg, #262626 0%, #101010 100%)",
    sceneColor: "#121212",
    accent: "#d4d0c8",
    ink: "#f2f0ea",
    muted: "rgb(242 240 234 / .55)",
    brandFont: FONTS.oswald,
    titleFont: FONTS.jost,
    uiFont: FONTS.josefin,
  },
  {
    id: "champagne",
    background:
      "radial-gradient(120% 90% at 50% 20%, #5a4a32 0%, transparent 55%), linear-gradient(160deg, #221c14 0%, #0f0c08 100%)",
    sceneColor: "#12100c",
    accent: "#e0c891",
    ink: "#f7f0e2",
    muted: "rgb(247 240 226 / .6)",
    brandFont: FONTS.cinzel,
    titleFont: FONTS.cormorant,
    uiFont: FONTS.lora,
  },
  {
    id: "midnight-ink",
    background:
      "radial-gradient(80% 60% at 70% 0%, #243056 0%, transparent 50%), linear-gradient(180deg, #0c1020 0%, #05070f 100%)",
    sceneColor: "#060812",
    accent: "#8ea0d8",
    ink: "#e8ecf8",
    muted: "rgb(232 236 248 / .58)",
    brandFont: FONTS.bodoni,
    titleFont: FONTS.playfair,
    uiFont: FONTS.jost,
  },
  {
    id: "terracotta",
    background:
      "radial-gradient(100% 80% at 10% 0%, #7a3f2e 0%, transparent 45%), linear-gradient(165deg, #2a1610 0%, #120a08 100%)",
    sceneColor: "#150c09",
    accent: "#e0a08a",
    ink: "#f8ebe4",
    muted: "rgb(248 235 228 / .6)",
    brandFont: FONTS.spectral,
    titleFont: FONTS.fraunces,
    uiFont: FONTS.cormorant,
  },
  {
    id: "forest-folio",
    background:
      "radial-gradient(90% 70% at 90% 100%, #1f4a38 0%, transparent 45%), linear-gradient(170deg, #0e1a14 0%, #060d0a 100%)",
    sceneColor: "#08110c",
    accent: "#8fbfa4",
    ink: "#e6f2ea",
    muted: "rgb(230 242 234 / .58)",
    brandFont: FONTS.lora,
    titleFont: FONTS.cinzel,
    uiFont: FONTS.josefin,
  },
];

function hashSlug(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

export function timesSkinFor(slug: string): TimesSkin {
  return SKINS[hashSlug(slug) % SKINS.length]!;
}

export function patchTimesDataForSkin<T extends { settings?: Record<string, unknown>; title?: string }>(
  data: T,
  slug: string,
): T & { settings: Record<string, unknown> } {
  const skin = timesSkinFor(slug);
  return {
    ...data,
    settings: {
      ...(data.settings || {}),
      brand: "Davetanisi",
      scene: "plain",
      background: skin.sceneColor,
      shadow: typeof data.settings?.shadow === "number" ? data.settings.shadow : 0.42,
    },
  };
}
