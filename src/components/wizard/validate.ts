import { isEmail, isValidIban } from "@/lib/format";
import type { InvitationDraft, WizardStepId } from "@/lib/storage";

export type Errors = Record<string, string>;

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function validateStep(step: WizardStepId, draft: InvitationDraft): Errors {
  const e: Errors = {};
  switch (step) {
    case "etkinlik":
      if (!draft.event) e.event = "Lütfen bir etkinlik türü seçin.";
      break;
    case "sablon":
      if (!draft.template) e.template = "Devam etmek için bir davetiye seçin.";
      break;
    case "diller":
      if (!draft.languages.length) e.languages = "Bir ana dil seçin.";
      break;
    case "bilgiler":
      // The original wizard lets you open Kontrol with gaps and only locks Ödeme.
      break;
    case "kontrol":
      if (!draft.termsAccepted) e.terms = "Devam etmek için koşulları kabul etmelisiniz.";
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

/** Required invitation fields. Ödeme stays locked until this is empty. */
export function infoIssues(draft: InvitationDraft): Errors {
  const e: Errors = {};
  const i = draft.info;
  if (i.partnerA.trim().length < 2) e.partnerA = "Gelinin adını yazın.";
  else if (i.partnerA.trim().length > 24) e.partnerA = "En fazla 24 karakter.";
  if (i.partnerB.trim().length < 2) e.partnerB = "Damadın adını yazın.";
  else if (i.partnerB.trim().length > 24) e.partnerB = "En fazla 24 karakter.";
  if (!i.date) e.date = "Etkinlik tarihini seçin.";
  else if (i.date < todayStr()) e.date = "Tarih bugünden önce olamaz.";
  if (!i.time) e.time = "Saati seçin.";
  if (draft.event === "coklu") {
    if (!i.kinaDate) e.kinaDate = "Kına gecesinin tarihini seçin.";
    else if (i.date && i.kinaDate > i.date) e.kinaDate = "Kına tarihi düğün tarihinden sonra olamaz.";
  }
  if (!off(draft, "aileler")) {
    if (i.brideFamily.trim().length < 2) e.brideFamily = "Gelinin ailesini yazın.";
    if (i.groomFamily.trim().length < 2) e.groomFamily = "Damadın ailesini yazın.";
  }
  if (!off(draft, "konum")) {
    if (i.place.trim().length < 2) e.place = "Mekân konumunu yazın.";
    if (i.venue.trim().length < 2) e.venue = "Mekân adını yazın.";
  }
  if (!off(draft, "program")) {
    const rows = draft.program.filter((p) => p.title.trim() || p.time.trim());
    if (!rows.length) e.program = "En az bir program satırı ekleyin.";
  }
  if (!off(draft, "iban")) {
    if (i.ibanHolder.trim().length < 2) e.ibanHolder = "Hesap sahibinin adını yazın.";
    if (!isValidIban(i.iban)) e.iban = "IBAN geçerli görünmüyor (TR ile başlayan 26 karakter).";
  } else if (i.iban.trim() && !isValidIban(i.iban)) {
    e.iban = "IBAN geçerli görünmüyor (TR ile başlayan 26 karakter).";
  }
  return e;
}

/** First step (in order) that is not complete for the draft; used to guard deep links. */
export function firstIncompleteBefore(step: WizardStepId, draft: InvitationDraft, order: readonly { id: WizardStepId }[]): WizardStepId | null {
  for (const s of order) {
    if (s.id === step) return null;
    if (Object.keys(validateStep(s.id, draft)).length > 0) return s.id;
  }
  return null;
}

export { isEmail };
