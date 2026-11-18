"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, type MouseEvent } from "react";
import Icon from "./Icon";
import { lp, type Locale } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";

function ExitButton({ slug, locale: localeProp }: { slug: string; locale?: Locale }) {
  const contextLocale = useLocale();
  const locale = localeProp ?? contextLocale;
  const en = locale === "en";
  const params = useSearchParams();
  const trying = params.get("dene") === "1";
  const fallback = trying ? lp(locale) : lp(locale, `/temalar/${slug}`);

  const onClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (typeof window === "undefined") return;
      // Prefer returning to the page that opened the fullscreen preview.
      if (window.history.length > 1) {
        const ref = document.referrer;
        try {
          if (ref) {
            const origin = window.location.origin;
            if (new URL(ref).origin === origin) {
              e.preventDefault();
              window.history.back();
            }
          }
        } catch {
          /* keep default href */
        }
      }
    },
    [],
  );

  return (
    <Link
      href={fallback}
      className="preview-exit"
      onClick={onClick}
      data-track="preview-exit"
      aria-label={en ? "Exit fullscreen preview" : "Tam ekran önizlemeden çık"}
    >
      <Icon name="close" size={18} />
      <span>{en ? "Exit" : "Çık"}</span>
    </Link>
  );
}

export default function PreviewExit({ slug, locale }: { slug: string; locale?: Locale }) {
  return (
    <Suspense fallback={null}>
      <ExitButton slug={slug} locale={locale} />
    </Suspense>
  );
}
