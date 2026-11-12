import { ADDONS, PRICE_FEATURES, type Addon } from "@/data/pricing";
import { newspapers, type Newspaper } from "@/data/newspapers";
import { FEATURED_SLUGS, themes, type Theme } from "@/data/themes";
import { isValidIban } from "@/lib/format";

export const STUDIO_PRICE_DEFAULT = 99;

const INCLUDED_BY_DEFAULT = new Set(["ani-duvari", "ani-cekimi"]);
const FEATURED = new Set<string>(FEATURED_SLUGS);

export interface PaymentSettings {
  bankName: string;
  accountHolder: string;
  iban: string;
  instructions: string;
  supportEmail: string;
  supportPhone: string;
}

export const DEFAULT_SETTINGS: PaymentSettings = {
  bankName: "",
  accountHolder: "",
  iban: "",
  instructions:
    "Havale veya EFT yaparken açıklama kısmına sipariş kodunu eksiksiz yazın. Tutar, sipariş özetindeki toplamla aynı olmalıdır. Ödeme hesaba geçince sipariş onaylanır.",
  supportEmail: "",
  supportPhone: "",
};

export interface CatalogAddon extends Addon {
  active: boolean;
  /** Shown as included (amount 0, price crossed out) instead of charged. */
  included: boolean;
}

export interface ThemeLive {
  price: number;
  compareAt: number;
  featured: boolean;
  hidden: boolean;
  badge: "" | "featured" | "new";
}

export interface PaperLive {
  price: number;
  compareAt: number;
  hidden: boolean;
}

export interface PublicCatalog {
  settings: PaymentSettings;
  paymentReady: boolean;
  addons: CatalogAddon[];
  themes: Record<string, ThemeLive>;
  newspapers: Record<string, PaperLive>;
  studioPrice: number;
  features: string[];
}

export interface ThemeOverride {
  price?: number;
  compareAt?: number;
  featured?: boolean;
  hidden?: boolean;
  badge?: "" | "featured" | "new";
}

export interface PaperOverride {
  price?: number;
  compareAt?: number;
  hidden?: boolean;
}

export interface AddonOverride {
  title?: string;
  note?: string;
  text?: string;
  price?: number;
  was?: number | null;
  active?: boolean;
  included?: boolean;
}

export interface CatalogOverrides {
  settings?: Partial<PaymentSettings>;
  themeOverrides?: Record<string, ThemeOverride>;
  paperOverrides?: Record<string, PaperOverride>;
  addonOverrides?: Record<string, AddonOverride>;
  studioPrice?: number;
  features?: string[] | null;
}

export function paymentReady(settings: PaymentSettings): boolean {
  return isValidIban(settings.iban) && settings.accountHolder.trim().length >= 3;
}

export function buildPublicCatalog(ov: CatalogOverrides = {}): PublicCatalog {
  const settings: PaymentSettings = { ...DEFAULT_SETTINGS, ...(ov.settings ?? {}) };
  const themesLive: Record<string, ThemeLive> = {};
  for (const t of themes) {
    const o = ov.themeOverrides?.[t.slug] ?? {};
    const badge = o.badge !== undefined ? o.badge : (t.badge ?? "");
    themesLive[t.slug] = {
      price: o.price ?? t.price,
      compareAt: o.compareAt ?? t.compareAt,
      featured: o.featured ?? FEATURED.has(t.slug),
      hidden: o.hidden ?? false,
      badge: badge === "featured" || badge === "new" ? badge : "",
    };
  }
  const papers: Record<string, PaperLive> = {};
  for (const n of newspapers) {
    const o = ov.paperOverrides?.[n.slug] ?? {};
    papers[n.slug] = {
      price: o.price ?? n.price,
      compareAt: o.compareAt ?? n.compareAt,
      hidden: o.hidden ?? false,
    };
  }
  const addons: CatalogAddon[] = ADDONS.map((a) => {
    const o = ov.addonOverrides?.[a.id] ?? {};
    return {
      ...a,
      title: o.title?.trim() || a.title,
      note: o.note !== undefined ? o.note : a.note,
      text: o.text?.trim() || a.text,
      price: o.price ?? a.price,
      was: o.was === null ? undefined : (o.was ?? a.was),
      active: o.active ?? true,
      included: o.included ?? INCLUDED_BY_DEFAULT.has(a.id),
    };
  });
  const features = ov.features && ov.features.length ? ov.features : [...PRICE_FEATURES];
  return {
    settings,
    paymentReady: paymentReady(settings),
    addons,
    themes: themesLive,
    newspapers: papers,
    studioPrice: ov.studioPrice ?? STUDIO_PRICE_DEFAULT,
    features,
  };
}

export function applyTheme(theme: Theme, cat: PublicCatalog): Theme {
  const o = cat.themes[theme.slug];
  if (!o) return theme;
  return {
    ...theme,
    price: o.price,
    compareAt: o.compareAt,
    featured: o.featured,
    badge: o.badge || undefined,
  };
}

export function applyNewspaper(paper: Newspaper, cat: PublicCatalog): Newspaper {
  const o = cat.newspapers[paper.slug];
  if (!o) return paper;
  return { ...paper, price: o.price, compareAt: o.compareAt };
}

export function visibleThemes(cat: PublicCatalog): Theme[] {
  return themes.map((t) => applyTheme(t, cat)).filter((t) => !cat.themes[t.slug]?.hidden);
}

export function startingPrice(cat: PublicCatalog): number {
  const list = visibleThemes(cat);
  if (!list.length) return 0;
  return Math.min(...list.map((t) => t.price));
}

export function defaultThemeLive(theme: Theme): ThemeLive {
  return {
    price: theme.price,
    compareAt: theme.compareAt,
    featured: FEATURED.has(theme.slug),
    hidden: false,
    badge: theme.badge ?? "",
  };
}

export function defaultAddon(a: Addon): CatalogAddon {
  return { ...a, active: true, included: INCLUDED_BY_DEFAULT.has(a.id) };
}
