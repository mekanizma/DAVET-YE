import type { Locale } from "@/i18n/locale";
import { isEmail, isValidIban } from "@/lib/format";
import type { InvitationDraft, WizardStepId } from "@/lib/storage";

export type Errors = Record<string, string>;

function say(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function validateStep(step: WizardStepId, draft: InvitationDraft, locale: Locale = "tr"): Errors {
  const e: Errors = {};
  switch (step) {
    case "etkinlik":
      if (!draft.event) e.event = say(locale, "Lütfen bir etkinlik türü seçin.", "Please choose an event type.");
      break;
    case "sablon":
      if (!draft.template) e.template = say(locale, "Devam etmek için bir davetiye seçin.", "Choose an invitation to continue.");
      break;
    case "diller":
      if (!draft.languages.length) e.languages = say(locale, "Bir ana dil seçin.", "Choose a main language.");
      break;
    case "bilgiler":
      // The original wizard lets you open Kontrol with gaps and only locks Ödeme.
      break;
    case "kontrol":
      if (!draft.termsAccepted) e.terms = say(locale, "Devam etmek için koşulları kabul etmelisiniz.", "Accept the terms to continue.");
      break;
    case "odeme":
      break;
  }
  return e;
}

const off = (draft: InvitationDraft, id: string) => draft.hiddenSections.includes(id);

/** Where each required field lives on the Bilgiler step. */
export const INFO_FIELDS: Record<string, { group: string; label: string }> = {
  partnerA: { group: "isimler", label: "Gelinin adı" },
  partnerB: { group: "isimler", label: "Damadın adı" },
  date: { group: "isimler", label: "Etkinlik tarihi" },
  time: { group: "isimler", label: "Etkinlik saati" },
  kinaDate: { group: "isimler", label: "Kına tarihi" },
  brideFamily: { group: "aileler", label: "Gelinin ailesi" },
  groomFamily: { group: "aileler", label: "Damadın ailesi" },
  place: { group: "konum", label: "Mekân konumu" },
  venue: { group: "konum", label: "Mekân adı" },
  program: { group: "program", label: "Program akışı" },
  ibanHolder: { group: "iban", label: "Hesap sahibi" },
  iban: { group: "iban", label: "IBAN" },
};

const INFO_LABEL_EN: Record<string, string> = {
  partnerA: "Bride’s name",
  partnerB: "Groom’s name",
  date: "Event date",
  time: "Event time",
  kinaDate: "Henna date",
  brideFamily: "Bride’s family",
  groomFamily: "Groom’s family",
  place: "Venue location",
  venue: "Venue name",
  program: "Order of the day",
  ibanHolder: "Account holder",
  iban: "IBAN",
};

export function infoFieldLabel(key: string, locale: Locale): string {
  const row = INFO_FIELDS[key];
  if (!row) return say(locale, "Eksik alan", "Missing field");
  if (locale !== "en") return row.label;
  return INFO_LABEL_EN[key] ?? row.label;
}

export function gapSentence(count: number, locale: Locale): string {
  if (locale === "en") {
    return count === 1
      ? "1 missing detail must be completed before payment."
      : `${count} missing details must be completed before payment.`;
  }
  return `Ödemeden önce ${count} eksik bilgi tamamlanmalı.`;
}

/** Required invitation fields. Ödeme stays locked until this is empty. */
export function infoIssues(draft: InvitationDraft, locale: Locale = "tr"): Errors {
  const e: Errors = {};
  const i = draft.info;
  if (i.partnerA.trim().length < 2) e.partnerA = say(locale, "Gelinin adını yazın.", "Enter the bride’s name.");
  else if (i.partnerA.trim().length > 24) e.partnerA = say(locale, "En fazla 24 karakter.", "24 characters at most.");
  if (i.partnerB.trim().length < 2) e.partnerB = say(locale, "Damadın adını yazın.", "Enter the groom’s name.");
  else if (i.partnerB.trim().length > 24) e.partnerB = say(locale, "En fazla 24 karakter.", "24 characters at most.");
  if (!i.date) e.date = say(locale, "Etkinlik tarihini seçin.", "Choose the event date.");
  else if (i.date < todayStr()) e.date = say(locale, "Tarih bugünden önce olamaz.", "The date cannot be before today.");
  if (!i.time) e.time = say(locale, "Saati seçin.", "Choose a time.");
  if (draft.event === "coklu") {
    if (!i.kinaDate) e.kinaDate = say(locale, "Kına gecesinin tarihini seçin.", "Choose the date of the henna night.");
    else if (i.date && i.kinaDate > i.date) e.kinaDate = say(locale, "Kına tarihi düğün tarihinden sonra olamaz.", "The henna night cannot be after the wedding date.");
  }
  if (!off(draft, "aileler")) {
    if (i.brideFamily.trim().length < 2) e.brideFamily = say(locale, "Gelinin ailesini yazın.", "Enter the bride’s family.");
    if (i.groomFamily.trim().length < 2) e.groomFamily = say(locale, "Damadın ailesini yazın.", "Enter the groom’s family.");
  }
  if (!off(draft, "konum")) {
    if (i.place.trim().length < 2) e.place = say(locale, "Mekân konumunu yazın.", "Enter the venue location.");
    if (i.venue.trim().length < 2) e.venue = say(locale, "Mekân adını yazın.", "Enter the venue name.");
  }
  if (!off(draft, "program")) {
    const rows = draft.program.filter((p) => p.title.trim() || p.time.trim());
    if (!rows.length) e.program = say(locale, "En az bir program satırı ekleyin.", "Add at least one line to the order of the day.");
  }
  if (!off(draft, "iban")) {
    if (i.ibanHolder.trim().length < 2) e.ibanHolder = say(locale, "Hesap sahibinin adını yazın.", "Enter the account holder’s name.");
    if (!isValidIban(i.iban)) e.iban = say(locale, "IBAN geçerli görünmüyor (TR ile başlayan 26 karakter).", "The IBAN does not look valid (26 characters, starting with TR).");
  } else if (i.iban.trim() && !isValidIban(i.iban)) {
    e.iban = say(locale, "IBAN geçerli görünmüyor (TR ile başlayan 26 karakter).", "The IBAN does not look valid (26 characters, starting with TR).");
  }
  return e;
}

/** First step (in order) that is not complete for the draft; used to guard deep links. */
export function firstIncompleteBefore(
  step: WizardStepId,
  draft: InvitationDraft,
  order: readonly { id: WizardStepId }[],
  locale: Locale = "tr",
): WizardStepId | null {
  for (const s of order) {
    if (s.id === step) return null;
    if (Object.keys(validateStep(s.id, draft, locale)).length > 0) return s.id;
  }
  return null;
}

export { isEmail };
