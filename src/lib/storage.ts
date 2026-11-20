"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CARD_LOOKS, QR_LOOKS } from "@/data/printCards";
import type { EventType } from "@/data/themes";

/**
 * Local-only persistence. Nothing here is ever sent to a server.
 * Keys are versioned so a future schema change can migrate or discard safely.
 */
const NS = "dvg";
const V = "v1";
const key = (name: string) => `${NS}:${name}:${V}`;

export { WIZARD_STEPS, type WizardStepId } from "./wizardSteps";

export interface DraftInfo {
  partnerA: string;
  partnerB: string;
  /** Name display font id from nameFonts catalog; "default" keeps the theme font. */
  nameFont: string;
  brideFamily: string;
  groomFamily: string;
  date: string;
  time: string;
  /** Optional end time; shown as a range when set. */
  endTime: string;
  /** Place search: venue name or address. */
  place: string;
  venue: string;
  address: string;
  mapUrl: string;
  message: string;
  story: string;
  /** Line under the family names. */
  familyNote: string;
  closing: string;
  dressCode: string;
  menu: string;
  /** "default" | "none" | a library track id */
  music: string;
  /** Couple’s own album photos (compressed data URLs) shown as a collage. */
  albumPhotos: string[];
  /** Short live-day announcement shown on the invitation on the event day. */
  liveNote: string;
  ibanHolder: string;
  iban: string;
  kinaDate: string;
  kinaTime: string;
  /** Party type or theme, shown under the title. */
  partyKind: string;
  /** Attendance note and expected guest count. */
  guestNote: string;
  /** Age limit or whether children are welcome. */
  ageNote: string;
  /** Ticket price, or a note that the party is free. */
  ticketNote: string;
  /** How to get there, and parking. */
  transportNote: string;
  /** Extra note for guests. */
  extraNote: string;
}

export interface DraftProgramItem {
  time: string;
  title: string;
  note: string;
}

export const DEFAULT_PROGRAM: DraftProgramItem[] = [
  { time: "19:00", title: "Karşılama", note: "Kokteyl ve canlı müzik" },
  { time: "20:00", title: "Nikâh Töreni", note: "Sevdiklerimizin şahitliğinde" },
  { time: "20:45", title: "Akşam Yemeği", note: "" },
  { time: "22:00", title: "Pasta & Dans", note: "Pist açılıyor" },
];

/** Sections kept off for baby shower invites — wizard only shows the rest. */
export const BABY_HIDDEN_SECTIONS = [
  "aileler",
  "tarih",
  "geri-sayim",
  "hikaye",
  "menu",
  "katilim",
  "ani-duvari",
  "ani-cekimi",
  "dilekler",
  "iban",
  "program",
  "album",
] as const;

export const BABY_DEFAULT_TITLE_TR = "Minik Bir Mucize Geliyor!";
export const BABY_DEFAULT_TITLE_EN = "A Little Miracle Is Coming!";
export const BABY_DEFAULT_MESSAGE_TR =
  "Bebeğimizi beklerken bu tatlı heyecanı bizimle paylaşmaya davetlisiniz.";
export const BABY_DEFAULT_MESSAGE_EN =
  "While we wait for our baby, you're invited to share this sweet excitement with us.";

export function isBabyShowerTemplate(template: string | null | undefined): boolean {
  return Boolean(template && /(^|-)baby-shower$/.test(template));
}

export function isPartyTemplate(template: string | null | undefined): boolean {
  return Boolean(template && /(^|-)parti$/.test(template));
}

/** Wedding-only sections stay off on a party invite. */
export const PARTY_HIDDEN_SECTIONS = [
  "aileler",
  "tarih",
  "soz",
  "nisan",
  "kina",
  "nikah",
  "dugun",
  "after",
  "geri-sayim",
  "hikaye",
  "album",
  "katilim",
  "ani-duvari",
  "ani-cekimi",
  "dilekler",
  "iban",
] as const;

export const PARTY_DEFAULT_TITLE_TR = "Bu Gece Bizim";
export const PARTY_DEFAULT_TITLE_EN = "Tonight Is Ours";
export const PARTY_DEFAULT_KIND_TR = "Doğum günü · neon gece";
export const PARTY_DEFAULT_KIND_EN = "Birthday · neon night";
export const PARTY_DEFAULT_MESSAGE_TR =
  "Işıklar yanınca yeriniz hazır. Dans, sohbet ve iyi bir gece için sizi bekliyoruz.";
export const PARTY_DEFAULT_MESSAGE_EN =
  "Your place is ready when the lights come up. Come for the dancing, the conversation, and a good night.";

export function babyProgram(locale: "tr" | "en" = "tr"): DraftProgramItem[] {
  return locale === "en"
    ? [
        { time: "15:00", title: "Welcome", note: "Pastel balloons and treats" },
        { time: "15:30", title: "Games", note: "Little contests" },
        { time: "16:00", title: "Cake", note: "Baby cake" },
        { time: "16:30", title: "Gifts", note: "Thanks and closing" },
      ]
    : [
        { time: "15:00", title: "Karşılama", note: "Pastel balonlar ve ikram" },
        { time: "15:30", title: "Oyunlar", note: "Minik yarışmalar" },
        { time: "16:00", title: "Pasta", note: "Bebek pastası" },
        { time: "16:30", title: "Hediyeler", note: "Teşekkür ve kapanış" },
      ];
}

export function partyProgram(locale: "tr" | "en" = "tr"): DraftProgramItem[] {
  return locale === "en"
    ? [
        { time: "21:00", title: "Welcome", note: "Doors and a first drink" },
        { time: "22:00", title: "DJ", note: "The floor opens" },
        { time: "00:00", title: "Cake", note: "A short pause, then more music" },
      ]
    : [
        { time: "21:00", title: "Karşılama", note: "Kapı ve ilk içki" },
        { time: "22:00", title: "DJ", note: "Pist açılır" },
        { time: "00:00", title: "Pasta", note: "Kısa bir mola, sonra müzik" },
      ];
}

export function applyPartyDefaults(
  draft: InvitationDraft,
  locale: "tr" | "en" = "tr",
): Partial<InvitationDraft> {
  const en = locale === "en";
  return {
    event: "parti",
    hiddenSections: [...PARTY_HIDDEN_SECTIONS],
    program: partyProgram(en ? "en" : "tr"),
    addons: [],
    info: {
      ...draft.info,
      time: draft.info.time && draft.info.time !== "19:00" ? draft.info.time : "21:00",
      endTime: draft.info.endTime.trim() || "01:00",
      familyNote: draft.info.familyNote.trim() || (en ? PARTY_DEFAULT_TITLE_EN : PARTY_DEFAULT_TITLE_TR),
      partyKind: draft.info.partyKind.trim() || (en ? PARTY_DEFAULT_KIND_EN : PARTY_DEFAULT_KIND_TR),
      message: draft.info.message.trim() || (en ? PARTY_DEFAULT_MESSAGE_EN : PARTY_DEFAULT_MESSAGE_TR),
    },
  };
}

export function applyBabyShowerDefaults(
  draft: InvitationDraft,
  locale: "tr" | "en" = "tr",
): Partial<InvitationDraft> {
  const en = locale === "en";
  return {
    event: "bebek",
    hiddenSections: [...BABY_HIDDEN_SECTIONS],
    program: [],
    addons: [],
    info: {
      ...draft.info,
      time: draft.info.time && draft.info.time !== "19:00" ? draft.info.time : "15:00",
      familyNote: draft.info.familyNote.trim() || (en ? BABY_DEFAULT_TITLE_EN : BABY_DEFAULT_TITLE_TR),
      message: draft.info.message.trim() || (en ? BABY_DEFAULT_MESSAGE_EN : BABY_DEFAULT_MESSAGE_TR),
    },
  };
}

export interface InvitationDraft {
  event: EventType | null;
  template: string | null;
  languages: string[];
  info: DraftInfo;
  /** Editable program rows shown on the invitation timeline */
  program: DraftProgramItem[];
  /** section ids switched OFF by the user */
  hiddenSections: string[];
  addons: string[];
  /** Free one-page print card, prepared after payment. */
  printCard: boolean;
  /** Selected Masa QR Kartı design id. */
  qrDesign: string;
  /** Selected one-page invitation card design id. */
  cardDesign: string;
  termsAccepted: boolean;
  order: null | {
    code: string;
    status: "bekliyor" | "bildirildi" | "onaylandi" | "reddedildi" | "test-success" | "test-failed";
    at: string;
    total: number;
    email?: string;
  };
  updatedAt: string;
}

export const emptyInfo: DraftInfo = {
  partnerA: "",
  partnerB: "",
  nameFont: "default",
  brideFamily: "",
  groomFamily: "",
  date: "",
  time: "19:00",
  endTime: "",
  place: "",
  venue: "",
  address: "",
  mapUrl: "",
  message: "",
  story: "",
  familyNote: "",
  closing: "",
  dressCode: "",
  menu: "",
  music: "default",
  albumPhotos: [],
  liveNote: "",
  ibanHolder: "",
  iban: "",
  kinaDate: "",
  kinaTime: "19:00",
  partyKind: "",
  guestNote: "",
  ageNote: "",
  ticketNote: "",
  transportNote: "",
  extraNote: "",
};

export const emptyDraft: InvitationDraft = {
  event: null,
  template: null,
  languages: ["tr"],
  info: emptyInfo,
  program: DEFAULT_PROGRAM.map((p) => ({ ...p })),
  hiddenSections: [],
  addons: [],
  printCard: false,
  qrDesign: "minimal",
  cardDesign: "altin",
  termsAccepted: false,
  order: null,
  updatedAt: "",
};

/* ---------------- low-level helpers ---------------- */

type Listener = () => void;
const listeners = new Set<Listener>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}

function writeRaw(k: string, v: string | null): boolean {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, v);
    return true;
  } catch {
    return false;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(NS + ":")) l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

function readJson<T>(k: string, fallback: T): T {
  const raw = readRaw(k);
  const hit = cache.get(k);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(k, { raw, value });
  return value;
}

function writeJson(k: string, value: unknown): boolean {
  const ok = writeRaw(k, JSON.stringify(value));
  if (ok) emit();
  return ok;
}

/* ---------------- invitation draft ---------------- */

const DRAFT_KEY = key("invitation-draft");

function normalizeProgram(raw: unknown): DraftProgramItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_PROGRAM.map((p) => ({ ...p }));
  return raw.map((row) => {
    const r = (row || {}) as Partial<DraftProgramItem> & { text?: string };
    return {
      time: String(r.time || ""),
      title: String(r.title || ""),
      note: String(r.note || r.text || ""),
    };
  });
}

export function loadDraft(): InvitationDraft {
  const d = readJson<Partial<InvitationDraft>>(DRAFT_KEY, {});
  return {
    ...emptyDraft,
    ...d,
    info: {
      ...emptyInfo,
      ...(d.info ?? {}),
      place: (d.info?.place || d.info?.venue || "").trim(),
      albumPhotos: Array.isArray(d.info?.albumPhotos)
        ? d.info.albumPhotos.filter((url): url is string => typeof url === "string" && url.startsWith("data:image/")).slice(0, 8)
        : [],
    },
    program: normalizeProgram(d.program),
    qrDesign: QR_LOOKS.some((look) => look.id === d.qrDesign) ? (d.qrDesign as string) : "minimal",
    cardDesign: CARD_LOOKS.some((look) => look.id === d.cardDesign) ? (d.cardDesign as string) : "altin",
  } as InvitationDraft;
}

// Memoised snapshot so useSyncExternalStore sees a stable reference.
let draftSnapshot: { raw: string | null; value: InvitationDraft } | null = null;
function getDraftSnapshot(): InvitationDraft {
  const raw = readRaw(DRAFT_KEY);
  if (draftSnapshot && draftSnapshot.raw === raw) return draftSnapshot.value;
  const value = loadDraft();
  draftSnapshot = { raw, value };
  return value;
}
const serverDraft: InvitationDraft = emptyDraft;

export function saveDraft(patch: Partial<InvitationDraft>): InvitationDraft {
  const cur = loadDraft();
  const next: InvitationDraft = {
    ...cur,
    ...patch,
    info: { ...cur.info, ...(patch.info ?? {}) },
    updatedAt: new Date().toISOString(),
  };
  writeJson(DRAFT_KEY, next);
  return next;
}

export function clearDraft() {
  writeRaw(DRAFT_KEY, null);
  emit();
}

export function useDraft(): { draft: InvitationDraft; ready: boolean } {
  const draft = useSyncExternalStore(subscribe, getDraftSnapshot, () => serverDraft);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { draft, ready };
}

/* ---------------- generic local list helpers ---------------- */

export function useLocalJson<T>(name: string, fallback: T): [T, (v: T) => void] {
  const k = key(name);
  const snap = useCallback(() => readJson<T>(k, fallback), [k, fallback]);
  const value = useSyncExternalStore(subscribe, snap, () => fallback);
  const set = useCallback((v: T) => void writeJson(k, v), [k]);
  return [value, set];
}

export function getLocalJson<T>(name: string, fallback: T): T {
  return readJson<T>(key(name), fallback);
}
export function setLocalJson(name: string, value: unknown): boolean {
  return writeJson(key(name), value);
}
export function removeLocal(name: string) {
  writeRaw(key(name), null);
  emit();
}

/* ---------------- RSVP / wishes in the preview ---------------- */

export interface Rsvp {
  name: string;
  attending: boolean;
  count: number;
  children?: number;
  meal?: string;
  transfer?: string;
  note: string;
  at: string;
}
export interface Wish {
  name: string;
  text: string;
  at: string;
}

/* ---------------- newspaper draft ---------------- */

export interface NewspaperTimelineItem {
  title: string;
  text: string;
}

export interface NewspaperProgramItem {
  time: string;
  title: string;
}

export interface NewspaperDraft {
  template: string;
  /**
   * Original GoPost/times panel binding: design.fields[].id → payload.values[id]
   * (text / dateTime / longText / image URL).
   */
  values: Record<string, string>;
  /** Stage texts with edit:"content" — design.pages[].elements[].id → text */
  contents: Record<string, string>;
  /** Kapak manşeti (legacy; migrated into values) */
  headline: string;
  tagline: string;
  edition: string;
  kicker: string;
  slogan: string;
  coverNote: string;
  scriptNote: string;
  inviteNote: string;
  /** İsimler (haber özneleri) */
  partnerA: string;
  partnerB: string;
  names: string;
  familyA: string;
  familyB: string;
  /** Künye */
  date: string;
  time: string;
  venue: string;
  address: string;
  /** İç sayfa metinleri */
  story: string;
  storySpot: string;
  quote: string;
  thanks: string;
  thanksTitle: string;
  closing: string;
  timeline: NewspaperTimelineItem[];
  program: NewspaperProgramItem[];
  photos: {
    cover: string;
    collage: string[];
  };
  size: "A3" | "A2";
  style: "original" | "sepia" | "mono";
  /**
   * How many template pages to keep while designing (1…template length).
   * `0` / unset = use every page in the template.
   */
  pageCount?: number;
  /** Free components placed on pages (icons, shapes, stickers, text). */
  extras?: import("@/lib/newspaperExtras").NewspaperExtra[];
  /** Canvas drag overrides for element ids (template slots + extras). */
  layout?: Record<string, { x: number; y: number; w?: number; h?: number }>;
  /** Language the draft text was seeded in. Etsy English does not reuse a Turkish draft. */
  locale?: "tr" | "en";
  updatedAt: string;
  orderCode?: string;
  orderEmail?: string;
}

export interface StoredOrder {
  code: string;
  at: string;
  total: number;
  template: string | null;
  title: string;
  status: string;
  kind?: string;
  email?: string;
}
export const NEWSPAPER_DRAFT = "newspaper-draft";

/* ---------------- mock auth (local only) ---------------- */

export interface MockSession {
  email: string;
  at: string;
  mock: true;
}
export const SESSION = "mock-session";

/* ---------------- cookie consent ---------------- */

export type ConsentChoice = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  at: string;
};
export const CONSENT = "cookie-consent";
export const OPEN_CONSENT_EVENT = "dvg:open-consent";
