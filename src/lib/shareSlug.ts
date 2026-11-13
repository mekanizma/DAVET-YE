import { CARD_LOOKS, QR_LOOKS } from "@/data/printCards";
import type { DraftInfo, DraftProgramItem, InvitationDraft } from "@/lib/storage";

export type ShareKind = "davetiye" | "gazete";

export type SharePublic = {
  slug: string;
  url: string;
  kind: ShareKind;
  status: "reserved" | "live" | "expired";
  expiresAt: string | null;
};

const BLOCKED = new Set([
  "tr", "en", "panel", "yonetim", "api", "d", "www", "admin", "auth",
  "onizleme", "times", "img", "fonts", "media", "etsy", "sitemap", "robots",
  "favicon", "gazeteler", "temalar", "hesap", "siparis",
]);

export function shareMonths(kind: ShareKind) {
  return kind === "gazete" ? 6 : 3;
}

export function slugifyShare(raw: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
  };
  let out = "";
  for (const ch of raw.trim().toLocaleLowerCase("tr")) out += map[ch] ?? ch;
  out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  out = out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  if (out.length < 3 || BLOCKED.has(out)) return "";
  return out;
}

export function suggestShareSlug(raw: string) {
  return slugifyShare(raw);
}

export function addMonths(iso: string, months: number) {
  const date = new Date(iso);
  const day = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + months);
  if (date.getUTCDate() < day) date.setUTCDate(0);
  return date.toISOString();
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, max) : "";
}

function stringMap(value: unknown, max: number, limit: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value).slice(0, limit)) {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(key)) continue;
    const next = text(raw, max);
    if (next) out[key] = next.startsWith("data:") && next.length > 400_000 ? "" : next;
    if (next.startsWith("data:") && next.length <= 400_000) out[key] = next;
  }
  return out;
}

export function invitationShareDesign(draft: InvitationDraft) {
  const info = draft.info;
  return {
    event: draft.event,
    template: draft.template,
    languages: draft.languages.slice(0, 4),
    hiddenSections: draft.hiddenSections.slice(0, 40),
    info: {
      partnerA: info.partnerA,
      partnerB: info.partnerB,
      brideFamily: info.brideFamily,
      groomFamily: info.groomFamily,
      date: info.date,
      time: info.time,
      endTime: info.endTime,
      place: info.place,
      venue: info.venue,
      address: info.address,
      mapUrl: info.mapUrl,
      message: info.message,
      story: info.story,
      familyNote: info.familyNote,
      closing: info.closing,
      dressCode: info.dressCode,
      menu: info.menu,
      music: info.music,
      ibanHolder: info.ibanHolder,
      iban: info.iban,
      kinaDate: info.kinaDate,
      kinaTime: info.kinaTime,
    } satisfies DraftInfo,
    program: (draft.program || []).slice(0, 16).map((row) => ({
      time: row.time,
      title: row.title,
      note: row.note,
    })) satisfies DraftProgramItem[],
  };
}

export function sanitizeShareDesign(kind: ShareKind, raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const body = raw as Record<string, unknown>;
  if (kind === "gazete") {
    const values = stringMap(body.values, 4000, 80);
    const contents = stringMap(body.contents, 4000, 200);
    let photos = 0;
    for (const [key, value] of Object.entries(values)) {
      if (!value.startsWith("data:")) continue;
      photos += 1;
      if (photos > 8) delete values[key];
    }
    const design = {
      template: text(body.template, 80),
      values,
      contents,
      size: body.size === "A2" ? "A2" : "A3",
      style: body.style === "sepia" || body.style === "mono" ? body.style : "original",
    };
    if (JSON.stringify(design).length > 1_800_000) {
      for (const [key, value] of Object.entries(design.values)) {
        if (value.startsWith("data:")) delete design.values[key];
      }
    }
    return design;
  }
  const info = (body.info && typeof body.info === "object" ? body.info : {}) as Record<string, unknown>;
  const program = Array.isArray(body.program) ? body.program : [];
  return {
    event: text(body.event, 40) || null,
    template: text(body.template, 80) || null,
    languages: Array.isArray(body.languages) ? body.languages.filter((x) => x === "tr" || x === "en").slice(0, 4) : ["tr"],
    hiddenSections: Array.isArray(body.hiddenSections) ? body.hiddenSections.map((x) => text(x, 40)).filter(Boolean).slice(0, 40) : [],
    info: {
      partnerA: text(info.partnerA, 80),
      partnerB: text(info.partnerB, 80),
      brideFamily: text(info.brideFamily, 160),
      groomFamily: text(info.groomFamily, 160),
      date: text(info.date, 20),
      time: text(info.time, 8),
      endTime: text(info.endTime, 8),
      place: text(info.place, 160),
      venue: text(info.venue, 160),
      address: text(info.address, 240),
      mapUrl: text(info.mapUrl, 300),
      message: text(info.message, 800),
      story: text(info.story, 2000),
      familyNote: text(info.familyNote, 800),
      closing: text(info.closing, 400),
      dressCode: text(info.dressCode, 160),
      menu: text(info.menu, 800),
      music: text(info.music, 40),
      ibanHolder: text(info.ibanHolder, 80),
      iban: text(info.iban, 40),
      kinaDate: text(info.kinaDate, 20),
      kinaTime: text(info.kinaTime, 8),
    },
    program: program.slice(0, 16).map((row) => {
      const item = (row || {}) as Record<string, unknown>;
      return { time: text(item.time, 8), title: text(item.title, 80), note: text(item.note, 160) };
    }),
  };
}
