import { ADDONS, LANGUAGES } from "@/data/pricing";
import { getNewspaper } from "@/data/newspapers";
import { getTheme } from "@/data/themes";
import { localizeNewspaper, themeTitle } from "@/i18n/catalog";
import type { Locale } from "@/i18n/locale";
import { localizeAddon } from "@/i18n/product";
import type { CatalogAddon, PublicCatalog } from "./catalog";
import type { InvitationDraft } from "./storage";

export interface PriceLine {
  id: string;
  label: string;
  amount: number;
  /** crossed-out original amount (e.g. included addon) */
  was?: number;
  note?: string;
}

type AddonLike = CatalogAddon | (typeof ADDONS)[number] & { active?: boolean; included?: boolean };

function catalogAddons(cat?: PublicCatalog): AddonLike[] {
  if (cat) return cat.addons;
  return ADDONS.map((a) => ({
    ...a,
    active: true,
    included: a.id === "ani-duvari" || a.id === "ani-cekimi",
  }));
}

/** Add-ons the customer can tick. Included perks and the per-language fee are handled separately. */
export function selectableAddons<T extends { id: string; active?: boolean; included?: boolean }>(addons: T[]): T[] {
  return addons.filter((a) => a.active !== false && !a.included && a.id !== "ek-dil");
}

export const SELECTABLE_ADDONS = selectableAddons(catalogAddons());

export function invitationQuote(
  input: { template: string | null; languages: string[]; addons: string[] },
  cat?: PublicCatalog,
  locale: Locale = "tr",
): { lines: PriceLine[]; total: number } {
  const addons = catalogAddons(cat).map((addon) => localizeAddon(addon, locale));
  const en = locale === "en";
  const lines: PriceLine[] = [];
  if (input.template) {
    const theme = getTheme(input.template);
    const over = cat?.themes[input.template];
    if (theme && !over?.hidden) {
      const price = over?.price ?? theme.price;
      const compareAt = over?.compareAt ?? theme.compareAt;
      lines.push({
        id: "theme",
        label: en ? `${themeTitle(theme, locale)} invitation` : `${theme.title} davetiyesi`,
        amount: price,
        was: compareAt > price ? compareAt : undefined,
      });
    }
  }
  for (const a of addons) {
    if (a.active === false || !a.included) continue;
    const was = a.was || a.price;
    lines.push({ id: a.id, label: en ? `${a.title} · included` : `${a.title} · dahil`, amount: 0, was: was || undefined });
  }
  const langAddon = addons.find((a) => a.id === "ek-dil");
  const known = new Set(LANGUAGES.map((l) => l.code));
  const extraLangs = input.languages.slice(1).filter((l) => known.has(l));
  if (extraLangs.length && langAddon && langAddon.active !== false && !langAddon.included && langAddon.price > 0) {
    lines.push({
      id: "langs",
      label: en ? `Extra language × ${extraLangs.length}` : `Ek dil × ${extraLangs.length}`,
      amount: langAddon.price * extraLangs.length,
    });
  }
  const selectable = selectableAddons(addons);
  for (const id of input.addons) {
    const a = selectable.find((x) => x.id === id);
    if (a) lines.push({ id: a.id, label: a.title + (a.note ? ` (${a.note})` : ""), amount: a.price, was: a.was && a.was > a.price ? a.was : undefined });
  }
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
}

export function priceLines(draft: InvitationDraft, cat?: PublicCatalog, locale: Locale = "tr"): PriceLine[] {
  return invitationQuote({ template: draft.template, languages: draft.languages, addons: draft.addons }, cat, locale).lines;
}

export function priceTotal(draft: InvitationDraft, cat?: PublicCatalog, locale: Locale = "tr"): number {
  return invitationQuote({ template: draft.template, languages: draft.languages, addons: draft.addons }, cat, locale).total;
}

export function paperQuote(slug: string, cat?: PublicCatalog, locale: Locale = "tr"): { lines: PriceLine[]; total: number } {
  const paper = getNewspaper(slug);
  if (!paper) return { lines: [], total: 0 };
  const named = localizeNewspaper(paper, locale);
  const over = cat?.newspapers[slug];
  const price = over?.price ?? paper.price;
  const compareAt = over?.compareAt ?? paper.compareAt;
  const lines: PriceLine[] = [{
    id: "paper",
    label: locale === "en" ? `${named.title} newspaper` : `${paper.title} gazetesi`,
    amount: price,
    was: compareAt > price ? compareAt : undefined,
  }];
  return { lines, total: price };
}
