import type { TimesReaderData } from "@/lib/times";
import type { NewspaperDraft } from "@/lib/storage";
import { draftDisplayNames } from "@/lib/newspaperDraft";

export type TimesFieldType = "text" | "longText" | "dateTime" | "date" | "image" | string;

export type TimesFieldDef = {
  id: string;
  label: string;
  type: TimesFieldType;
  help?: string;
  sample?: string;
  required?: boolean;
  maxLength?: number;
  role?: string;
  group?: string;
};

export type TimesDesignPayload = {
  design?: {
    fields?: TimesFieldDef[];
  };
  values?: Record<string, string>;
};

/** Field definitions from a times design payload (original panel schema). */
export function timesFieldsFromData(data: TimesReaderData | null | undefined): TimesFieldDef[] {
  const payload = (data?.payload || {}) as TimesDesignPayload;
  const fields = payload.design?.fields;
  return Array.isArray(fields) ? fields : [];
}

/** Preserve first-seen group order from design.fields. */
export function timesFieldGroups(fields: TimesFieldDef[]): { id: string; label: string; fields: TimesFieldDef[] }[] {
  const order: string[] = [];
  const map = new Map<string, TimesFieldDef[]>();
  for (const f of fields) {
    const label = (f.group || "").trim() || "Genel";
    if (!map.has(label)) {
      map.set(label, []);
      order.push(label);
    }
    map.get(label)!.push(f);
  }
  return order.map((label) => ({ id: slugGroup(label), label, fields: map.get(label)! }));
}

function slugGroup(label: string) {
  return label
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9ğüşıöç]+/gi, "-")
    .replace(/^-|-$/g, "") || "genel";
}

/**
 * Original times-reader resolver:
 *   values[fieldId] if truthy, else field.sample (in preview), else image el.src
 * Image overrides: resolver.raw(fieldId)?.value || el.src
 */
export function applyTimesValues(
  data: TimesReaderData,
  values: Record<string, string>,
  opts?: { embedded?: boolean },
): TimesReaderData {
  const payload = { ...(data.payload as Record<string, unknown>) };
  const nextValues: Record<string, string> = {
    ...((payload.values as Record<string, string> | undefined) || {}),
  };

  for (const [id, raw] of Object.entries(values)) {
    const v = typeof raw === "string" ? raw : "";
    if (v.trim()) nextValues[id] = v;
    else delete nextValues[id];
  }

  payload.values = nextValues;

  return {
    ...data,
    payload,
    preview: true,
    embedded: opts?.embedded ?? true,
  };
}

/** Seed editable values from design samples / payload (skip images — keep artboard defaults). */
export function seedTimesValues(data: TimesReaderData): Record<string, string> {
  const fields = timesFieldsFromData(data);
  const payload = data.payload as TimesDesignPayload;
  const base = { ...(payload.values || {}) };
  const out: Record<string, string> = {};

  for (const f of fields) {
    if (f.type === "image") continue;
    const fromPayload = base[f.id];
    const sample = typeof f.sample === "string" ? f.sample : "";
    const v = (fromPayload && String(fromPayload).trim()) || sample;
    if (v) out[f.id] = v;
  }
  return out;
}

/** Map legacy NewspaperDraft flat fields → times values keys. */
export function legacyDraftToTimesValues(draft: NewspaperDraft): Record<string, string> {
  const out: Record<string, string> = { ...(draft.values || {}) };
  const names = draftDisplayNames(draft);
  if (names && !out.names) out.names = names;
  if (draft.story?.trim() && !out.story) out.story = draft.story;
  if (draft.thanks?.trim() && !out.thanks) out.thanks = draft.thanks;
  if (draft.venue?.trim() && !out.venue) out.venue = draft.venue;
  if (draft.address?.trim() && !out.venueArea) out.venueArea = draft.address;

  if (draft.date && !out.weddingDate && !out.eventDate) {
    const time = draft.time?.trim() || "19:00";
    const iso = toIsoLocal(draft.date, time);
    out.weddingDate = iso;
    out.eventDate = iso;
  }

  if (draft.photos?.cover && !out.coverPhoto) out.coverPhoto = draft.photos.cover;
  const collage = draft.photos?.collage || [];
  collage.forEach((src, i) => {
    if (!src) return;
    const key = `photo${i + 1}`;
    if (!out[key]) out[key] = src;
  });

  if (draft.headline?.trim()) {
    if (!out.eventName) out.eventName = draft.headline;
    if (!out.title) out.title = draft.headline;
    if (!out.brand) out.brand = draft.headline;
    if (!out.festival) out.festival = draft.headline;
  }

  return out;
}

export function toIsoLocal(date: string, time: string) {
  const t = time.length === 5 ? `${time}:00` : time || "19:00:00";
  // Store as local wall time with Z suffix matching original samples style loosely
  return `${date}T${t}Z`;
}

export function fromIsoDate(iso: string | undefined): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] || "";
}

export function fromIsoTime(iso: string | undefined): string {
  if (!iso) return "";
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m?.[1] || "";
}

export function displayTitleFromValues(values: Record<string, string>, fallback = "") {
  return (
    values.names?.trim() ||
    values.eventName?.trim() ||
    values.title?.trim() ||
    values.brand?.trim() ||
    values.festival?.trim() ||
    fallback
  );
}
