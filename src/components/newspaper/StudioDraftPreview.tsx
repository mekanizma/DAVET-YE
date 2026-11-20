"use client";

import { useEffect, useState } from "react";
import TimesReader from "@/components/TimesReader";
import type { Locale } from "@/i18n/locale";
import type { TimesReaderData } from "@/lib/times";

export const STUDIO_FULL_PREVIEW_KEY = "dvg:ns-full-preview";

export default function StudioDraftPreview({
  slug,
  fallback,
  locale,
}: {
  slug: string;
  fallback: TimesReaderData;
  locale?: Locale;
}) {
  const [data, setData] = useState(fallback);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STUDIO_FULL_PREVIEW_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { slug?: string; data?: TimesReaderData };
      if (parsed?.slug === slug && parsed.data) {
        setData({ ...parsed.data, embedded: false, preview: true });
      }
    } catch {
      /* keep template fallback */
    }
  }, [slug]);

  return <TimesReader data={data} slug={slug} embedded={false} locale={locale} />;
}

export function stashStudioFullPreview(slug: string, data: TimesReaderData) {
  try {
    sessionStorage.setItem(
      STUDIO_FULL_PREVIEW_KEY,
      JSON.stringify({ slug, data: { ...data, embedded: false, preview: true } }),
    );
  } catch {
    /* ignore quota */
  }
}
