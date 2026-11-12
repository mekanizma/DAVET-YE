import raw from "./themes.json";
import openingVideos from "./openingVideos.json";

export type OpeningType = "envelope" | "door" | "seal" | "curtain";
export type EventType = "nisan-dugun" | "coklu" | "kina";

const OPENING_VIDEO_MAP = openingVideos as Record<string, string>;

export interface ThemeColors {
  accent: string;
  accentDeep: string;
  tint: string;
  tint2: string;
  gold: string;
}

export interface Theme {
  slug: string;
  title: string;
  price: number;
  compareAt: number;
  badge?: "featured" | "new";
  /** 480px catalogue cover (local) */
  cover: string;
  /** 640px cover for the six featured themes (local) */
  heroCover?: string;
  opening: OpeningType;
  featured: boolean;
  order: number;
  eventTypes: EventType[];
  tags: string[];
  eyebrow: string;
  description: string;
  colors: ThemeColors;
}

export const themes: Theme[] = raw as unknown as Theme[];

export const EVENT_LABELS: Record<EventType, string> = {
  "nisan-dugun": "Nişan & Düğün",
  coklu: "Çoklu Etkinlik",
  kina: "Kına",
};

export const EVENT_DESCRIPTIONS: Record<EventType, string> = {
  "nisan-dugun": "Nişan veya düğün davetiyesi",
  coklu: "Kına, nikâh, düğün… birden fazla töreni tek davetiyede birleştirin",
  kina: "Kına gecesi davetiyesi",
};

export const OPENING_LABELS: Record<OpeningType, string> = {
  envelope: "Zarf açılışı",
  door: "Kapı açılışı",
  seal: "Mühür açılışı",
  curtain: "Perde açılışı",
};

export const FEATURED_SLUGS = [
  "akdeniz-masali",
  "guz-masali",
  "barok-kapi",
  "tavuslu-cini",
  "opera-gecesi",
  "bordo-muhur",
] as const;

export function getTheme(slug: string): Theme | undefined {
  return themes.find((t) => t.slug === slug);
}

export function coverOf(theme: Theme): string {
  return theme.heroCover ?? theme.cover;
}

/** Local acilis.mp4 path when the theme ships with an opening video. */
export function openingVideoOf(theme: Theme): string | null {
  return OPENING_VIDEO_MAP[theme.slug] ?? null;
}

export function getFeatured(): Theme[] {
  return FEATURED_SLUGS.map((s) => getTheme(s)).filter(
    (t): t is Theme => Boolean(t),
  );
}

export const minPrice = Math.min(...themes.map((t) => t.price));

export function discountPercent(theme: Theme): number {
  if (!theme.compareAt || theme.compareAt <= theme.price) return 0;
  return Math.round((1 - theme.price / theme.compareAt) * 100);
}

export function similarThemes(theme: Theme, count = 4): Theme[] {
  const score = (t: Theme) =>
    (t.opening === theme.opening ? 2 : 0) +
    t.tags.filter((x) => theme.tags.includes(x)).length +
    (t.featured ? 1 : 0);
  return themes
    .filter((t) => t.slug !== theme.slug)
    .sort((a, b) => score(b) - score(a) || a.order - b.order)
    .slice(0, count);
}

/** All tags that exist on at least one theme. */
export const allTags: string[] = Array.from(
  new Set(themes.flatMap((t) => t.tags)),
).sort((a, b) => a.localeCompare(b, "tr"));

export function popularity(t: Theme): number {
  return (t.featured ? 100 : 0) + (t.badge === "featured" ? 50 : 0) + (t.badge === "new" ? 20 : 0) - t.order * 0.1;
}
