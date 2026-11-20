"use client";

import { useEffect, useState } from "react";
import TimesReader from "@/components/TimesReader";
import type { Locale } from "@/i18n/locale";
import {
  EMPTY_NEWSPAPER_DRAFT,
  normalizeNewspaperDraft,
} from "@/lib/newspaperDraft";
import { getLocalJson, NEWSPAPER_DRAFT, setLocalJson, type NewspaperDraft } from "@/lib/storage";
import type { TimesReaderData } from "@/lib/times";
import { legacyDraftToTimesValues } from "@/lib/timesFields";
import { applyTimesDraft } from "@/lib/timesPages";

export const STUDIO_FULL_PREVIEW_KEY = "dvg:ns-full-preview";

type StashPayload = {
  slug?: string;
  /** Compact studio draft — preferred (survives new tabs via localStorage). */
  draft?: Partial<NewspaperDraft>;
  /** Legacy full reader payload (same-tab sessionStorage only). */
  data?: TimesReaderData;
};

function applyDraftToDesign(design: TimesReaderData, draft: NewspaperDraft): TimesReaderData {
  return applyTimesDraft(
    design,
    {
      values: { ...legacyDraftToTimesValues(draft), ...(draft.values || {}) },
      contents: draft.contents || {},
      pageCount: draft.pageCount,
      extras: draft.extras || [],
      layout: (draft.layout || {}) as Record<string, { x: number; y: number; w?: number; h?: number }>,
    },
    { embedded: false },
  );
}

function readStash(): StashPayload | null {
  try {
    const fromLocal = localStorage.getItem(STUDIO_FULL_PREVIEW_KEY);
    if (fromLocal) return JSON.parse(fromLocal) as StashPayload;
  } catch {
    /* ignore */
  }
  try {
    const fromSession = sessionStorage.getItem(STUDIO_FULL_PREVIEW_KEY);
    if (fromSession) return JSON.parse(fromSession) as StashPayload;
  } catch {
    /* ignore */
  }
  return null;
}

export default function StudioDraftPreview({
  slug,
  fallback,
  locale,
}: {
  slug: string;
  fallback: TimesReaderData;
  locale?: Locale;
}) {
  const [data, setData] = useState<TimesReaderData | null>(null);

  useEffect(() => {
    const stash = readStash();
    if (stash?.slug === slug && stash.data?.payload) {
      setData({ ...stash.data, embedded: false, preview: true });
      return;
    }

    const saved = normalizeNewspaperDraft(getLocalJson(NEWSPAPER_DRAFT, EMPTY_NEWSPAPER_DRAFT));
    const fromStash =
      stash?.slug === slug && stash.draft
        ? normalizeNewspaperDraft({ ...saved, ...stash.draft, template: slug })
        : saved;

    if (fromStash.template && fromStash.template !== slug) {
      setData({ ...fallback, embedded: false, preview: true });
      return;
    }

    const applied = applyDraftToDesign(fallback, { ...fromStash, template: slug });
    setData({ ...applied, embedded: false, preview: true });
  }, [slug, fallback]);

  if (!data) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#111", color: "#eee" }}>
        {locale === "en" ? "Loading your draft…" : "Taslağınız yükleniyor…"}
      </div>
    );
  }

  return <TimesReader data={data} slug={slug} embedded={false} locale={locale} />;
}

/** Persist a compact draft so Önizle in a new tab can rebuild the live design. */
export function stashStudioFullPreview(slug: string, draft: NewspaperDraft) {
  const payload: StashPayload = {
    slug,
    draft: {
      template: slug,
      values: draft.values || {},
      contents: draft.contents || {},
      pageCount: draft.pageCount,
      extras: draft.extras || [],
      layout: draft.layout || {},
      photos: draft.photos,
      size: draft.size,
      style: draft.style,
      locale: draft.locale,
      updatedAt: draft.updatedAt || new Date().toISOString(),
    },
  };
  const raw = JSON.stringify(payload);
  try {
    localStorage.setItem(STUDIO_FULL_PREVIEW_KEY, raw);
  } catch {
    /* quota — newspaper draft in localStorage is still the source of truth */
  }
  try {
    sessionStorage.setItem(STUDIO_FULL_PREVIEW_KEY, raw);
  } catch {
    /* ignore */
  }
  // Keep the canonical draft key in sync right before opening preview.
  try {
    setLocalJson(NEWSPAPER_DRAFT, normalizeNewspaperDraft({ ...draft, template: slug }));
  } catch {
    /* ignore */
  }
}
