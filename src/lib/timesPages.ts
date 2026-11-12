import type { TimesReaderData } from "@/lib/times";
import type { TimesFieldDef } from "@/lib/timesFields";
import { applyTimesValues, timesFieldsFromData } from "@/lib/timesFields";

export type TimesPageSlot =
  | {
      kind: "content";
      id: string;
      pageIndex: number;
      pageName: string;
      label: string;
      text: string;
      multiline: boolean;
      maxLength?: number;
    }
  | {
      kind: "field";
      id: string;
      pageIndex: number;
      pageName: string;
      field: TimesFieldDef;
    }
  | {
      kind: "image";
      id: string;
      pageIndex: number;
      pageName: string;
      fieldId: string;
      label: string;
      help?: string;
      required?: boolean;
    };

export type TimesPageEditor = {
  index: number;
  id: string;
  name: string;
  slots: TimesPageSlot[];
};

type StageEl = {
  id?: string;
  type?: string;
  name?: string;
  text?: string;
  edit?: string | boolean;
  fieldId?: string;
  style?: { size?: number };
  elements?: StageEl[];
};

type StagePage = {
  id?: string;
  name?: string;
  elements?: StageEl[];
};

function walkElements(els: StageEl[] | undefined, visit: (el: StageEl) => void) {
  if (!Array.isArray(els)) return;
  for (const el of els) {
    visit(el);
    if (Array.isArray(el.elements)) walkElements(el.elements, visit);
  }
}

function contentLabel(el: StageEl) {
  if (el.name?.trim()) return el.name.trim();
  const t = String(el.text || "")
    .replace(/\s+/g, " ")
    .trim();
  return t.slice(0, 36) || el.id || "Metin";
}

/**
 * Build page-by-page editors from design.pages (original panel surface):
 * - edit:"content" texts → contents[elementId]
 * - fieldId fields → values[fieldId] (deduped per page)
 * - edit:"photo" / image+fieldId → values[fieldId]
 */
export function timesPageEditors(data: TimesReaderData | null | undefined): TimesPageEditor[] {
  if (!data) return [];
  const payload = data.payload as {
    design?: { pages?: StagePage[]; fields?: TimesFieldDef[] };
  };
  const pages = payload.design?.pages || [];
  const fieldDefs = timesFieldsFromData(data);
  const fieldById = new Map(fieldDefs.map((f) => [f.id, f]));

  return pages.map((page, index) => {
    const pageName = page.name || `Sayfa ${index + 1}`;
    const pageId = page.id || `page-${index}`;
    const slots: TimesPageSlot[] = [];
    const seenFields = new Set<string>();

    walkElements(page.elements, (el) => {
      if (!el?.id) return;

      if ((el.type === "text" || el.type === "field") && (el.edit === "content" || el.edit === true) && !el.fieldId) {
        const text = typeof el.text === "string" ? el.text : "";
        slots.push({
          kind: "content",
          id: el.id,
          pageIndex: index,
          pageName,
          label: contentLabel(el),
          text,
          multiline: text.includes("\n") || text.length > 48 || (el.style?.size || 0) < 18,
          maxLength: text.length > 200 ? 900 : 220,
        });
        return;
      }

      if (el.fieldId && (el.type === "field" || el.type === "text")) {
        if (seenFields.has(el.fieldId)) return;
        seenFields.add(el.fieldId);
        const def =
          fieldById.get(el.fieldId) ||
          ({
            id: el.fieldId,
            label: el.name || el.fieldId,
            type: "text",
            group: pageName,
          } satisfies TimesFieldDef);
        if (def.type === "image") return;
        slots.push({
          kind: "field",
          id: el.fieldId,
          pageIndex: index,
          pageName,
          field: def,
        });
        return;
      }

      if (el.type === "image" && el.fieldId) {
        if (seenFields.has(el.fieldId)) return;
        seenFields.add(el.fieldId);
        const def = fieldById.get(el.fieldId);
        slots.push({
          kind: "image",
          id: el.id,
          pageIndex: index,
          pageName,
          fieldId: el.fieldId,
          label: def?.label || el.name || el.fieldId,
          help: def?.help,
          required: def?.required,
        });
      }
    });

    return { index, id: pageId, name: pageName, slots };
  });
}

/** Seed contents map from design (elementId → text). */
export function seedTimesContents(data: TimesReaderData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const page of timesPageEditors(data)) {
    for (const slot of page.slots) {
      if (slot.kind === "content" && slot.text.trim()) out[slot.id] = slot.text;
    }
  }
  return out;
}

function applyContentsToPages(pages: StagePage[], contents: Record<string, string>): StagePage[] {
  return pages.map((page) => {
    const nextEls = structuredClone(page.elements || []) as StageEl[];
    walkElements(nextEls, (el) => {
      if (!el?.id) return;
      if (Object.prototype.hasOwnProperty.call(contents, el.id)) {
        el.text = contents[el.id] ?? "";
      }
    });
    return { ...page, elements: nextEls };
  });
}

/** Merge values + page content overrides into a mountable times payload. */
export function applyTimesDraft(
  data: TimesReaderData,
  draft: { values: Record<string, string>; contents: Record<string, string> },
  opts?: { embedded?: boolean },
): TimesReaderData {
  const withValues = applyTimesValues(data, draft.values, opts);
  const payload = { ...(withValues.payload as Record<string, unknown>) };
  const design = { ...((payload.design as Record<string, unknown>) || {}) };
  const pages = (design.pages as StagePage[] | undefined) || [];
  if (pages.length && Object.keys(draft.contents || {}).length) {
    design.pages = applyContentsToPages(pages, draft.contents);
    payload.design = design;
  }
  return { ...withValues, payload, preview: true, embedded: opts?.embedded ?? true };
}
