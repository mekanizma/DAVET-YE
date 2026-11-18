"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Icon from "./Icon";
import { getTheme } from "@/data/themes";
import type { Locale } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";
import { formatTL } from "@/lib/format";
import { continueAfterTryUrl } from "@/lib/tryInvite";

function Bar({ slug, locale: localeProp }: { slug: string; locale?: Locale }) {
  const contextLocale = useLocale();
  const locale = localeProp ?? contextLocale;
  const en = locale === "en";
  const params = useSearchParams();
  const trying = params.get("dene") === "1" && params.get("taslak") === "1";
  if (!trying) return null;
  const theme = getTheme(slug);
  if (!theme) return null;
  const href = continueAfterTryUrl(slug, locale);

  return (
    <div className="try-bar" role="region" aria-label={en ? "Continue with this design" : "Bu tasarımla devam et"}>
      <div className="try-bar__inner">
        <div className="try-bar__copy">
          <strong>{en ? "Liked it with your names?" : "İsimlerinizle beğendiniz mi?"}</strong>
          <span className="muted">
            {en
              ? "Create a free account and keep editing this design."
              : "Ücretsiz hesap oluşturun, aynı tasarımla düzenlemeye devam edin."}
          </span>
        </div>
        <Link href={href} className="btn btn--dark btn--lg try-bar__cta" data-track="try-continue">
          {en
            ? `Continue with this design · ${formatTL(theme.price, locale)}`
            : `Bu tasarımla devam et · ${formatTL(theme.price, locale)}`}
          <Icon name="arrow" size={16} />
        </Link>
      </div>
    </div>
  );
}

export default function TryContinueBar({ slug, locale }: { slug: string; locale?: Locale }) {
  return (
    <Suspense fallback={null}>
      <Bar slug={slug} locale={locale} />
    </Suspense>
  );
}
