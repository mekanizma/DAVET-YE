import { getTheme, type EventType } from "@/data/themes";
import {
  applyBabyShowerDefaults,
  applyPartyDefaults,
  emptyDraft,
  emptyInfo,
  loadDraft,
  saveDraft,
  type InvitationDraft,
} from "@/lib/storage";
import type { Locale } from "@/i18n/locale";
import { withLocaleQuery } from "@/i18n/locale";

export type TryInviteInput = {
  slug: string;
  partnerA: string;
  partnerB: string;
  date: string;
  locale: Locale;
};

function cleanName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 60);
}

export function previewTryUrl(slug: string, locale: Locale) {
  return withLocaleQuery(locale, `/onizleme/tema/${encodeURIComponent(slug)}?taslak=1&dene=1`);
}

export function continueAfterTryUrl(slug: string, locale: Locale) {
  const wizard = `/${locale}/davetiye-olustur/bilgiler?sablon=${encodeURIComponent(slug)}`;
  return `/panel/kayit?next=${encodeURIComponent(wizard)}`;
}

/** Saves the try-out names into the local wizard draft (no account needed). */
export function applyTryInvite(input: TryInviteInput): InvitationDraft | null {
  const theme = getTheme(input.slug);
  if (!theme) return null;
  const partnerA = cleanName(input.partnerA);
  const partnerB = cleanName(input.partnerB);
  const date = input.date.trim().slice(0, 10);
  if (partnerA.length < 2 || partnerB.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const event: EventType = theme.eventTypes[0] ?? "nisan-dugun";
  const localeLang = input.locale === "en" ? "en" : "tr";
  const current = loadDraft();
  let next: InvitationDraft = {
    ...emptyDraft,
    ...current,
    event,
    template: theme.slug,
    languages: current.languages?.length ? current.languages : [localeLang],
    info: {
      ...emptyInfo,
      ...current.info,
      partnerA,
      partnerB,
      date,
    },
    order: null,
    termsAccepted: false,
  };

  if (event === "bebek" || theme.eventTypes.includes("bebek")) {
    next = { ...next, ...applyBabyShowerDefaults(next, localeLang) };
    next.info = { ...next.info, partnerA, partnerB, date };
  } else if (event === "parti" || theme.eventTypes.includes("parti")) {
    next = { ...next, ...applyPartyDefaults(next, localeLang) };
    next.info = { ...next.info, partnerA, partnerB, date };
  }

  return saveDraft(next);
}
