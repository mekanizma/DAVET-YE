import { getTheme, type EventType } from "@/data/themes";
import type { OrderRecord } from "@/lib/orderTypes";
import type { InvitationDraft, NewspaperDraft } from "@/lib/storage";
import { emptyInfo } from "@/lib/storage";

function text(value: unknown, max = 400) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function stringMap(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {} as Record<string, string>;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** Build an invitation draft from the published share payload. */
export function invitationDraftFromShare(
  design: Record<string, unknown>,
  order: OrderRecord,
): Partial<InvitationDraft> {
  const infoRaw = design.info && typeof design.info === "object" && !Array.isArray(design.info)
    ? (design.info as Record<string, unknown>)
    : {};
  const eventRaw = text(design.event, 40);
  const event: EventType | null =
    eventRaw === "nisan-dugun" || eventRaw === "coklu" || eventRaw === "kina" || eventRaw === "bebek" || eventRaw === "parti"
      ? eventRaw
      : null;
  const languages = Array.isArray(design.languages)
    ? design.languages.filter((x): x is string => x === "tr" || x === "en").slice(0, 4)
    : ["tr"];
  const program = Array.isArray(design.program)
    ? design.program.slice(0, 16).map((row) => {
        const item = (row || {}) as Record<string, unknown>;
        return { time: text(item.time, 8), title: text(item.title, 80), note: text(item.note, 160) };
      })
    : undefined;
  const hiddenSections = Array.isArray(design.hiddenSections)
    ? design.hiddenSections.map((x) => text(x, 40)).filter(Boolean).slice(0, 40)
    : [];

  const template = text(design.template, 80) || order.template || null;
  const theme = template ? getTheme(template) : undefined;
  const resolvedEvent =
    event && theme?.eventTypes.includes(event)
      ? event
      : theme?.eventTypes[0] || event || "nisan-dugun";

  return {
    event: resolvedEvent,
    template,
    languages: languages.length ? languages : ["tr"],
    hiddenSections,
    program,
    info: {
      ...emptyInfo,
      partnerA: text(infoRaw.partnerA, 80),
      partnerB: text(infoRaw.partnerB, 80),
      nameFont: text(infoRaw.nameFont, 40) || "default",
      brideFamily: text(infoRaw.brideFamily, 160),
      groomFamily: text(infoRaw.groomFamily, 160),
      date: text(infoRaw.date, 20),
      time: text(infoRaw.time, 8) || "19:00",
      endTime: text(infoRaw.endTime, 8),
      place: text(infoRaw.place, 160),
      venue: text(infoRaw.venue, 160),
      address: text(infoRaw.address, 240),
      mapUrl: text(infoRaw.mapUrl, 300),
      message: text(infoRaw.message, 800),
      story: text(infoRaw.story, 2000),
      familyNote: text(infoRaw.familyNote, 800),
      closing: text(infoRaw.closing, 400),
      dressCode: text(infoRaw.dressCode, 160),
      menu: text(infoRaw.menu, 800),
      music: text(infoRaw.music, 40) || "default",
      albumPhotos: (Array.isArray(infoRaw.albumPhotos) ? infoRaw.albumPhotos : [])
        .filter((url): url is string => typeof url === "string" && url.startsWith("data:image/"))
        .slice(0, 8),
      liveNote: text(infoRaw.liveNote, 280),
      ibanHolder: text(infoRaw.ibanHolder, 80),
      iban: text(infoRaw.iban, 40),
      kinaDate: text(infoRaw.kinaDate, 20),
      kinaTime: text(infoRaw.kinaTime, 8) || "19:00",
      partyKind: text(infoRaw.partyKind, 80),
      guestNote: text(infoRaw.guestNote, 120),
      ageNote: text(infoRaw.ageNote, 120),
      ticketNote: text(infoRaw.ticketNote, 200),
      transportNote: text(infoRaw.transportNote, 300),
      extraNote: text(infoRaw.extraNote, 400),
    },
    termsAccepted: true,
    order: {
      code: order.code,
      status: "onaylandi",
      at: order.createdAt,
      total: order.total,
      email: order.customer.email,
    },
  };
}

/** Build a newspaper draft patch from the published share payload. */
export function newspaperDraftFromShare(
  design: Record<string, unknown>,
  order: OrderRecord,
): Partial<NewspaperDraft> {
  return {
    template: text(design.template, 80) || order.template || undefined,
    values: stringMap(design.values),
    contents: stringMap(design.contents),
    size: design.size === "A2" ? "A2" : "A3",
    style: design.style === "sepia" || design.style === "mono" ? design.style : "original",
    orderCode: order.code,
    orderEmail: order.customer.email,
  };
}
