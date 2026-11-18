"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { useCatalog } from "@/components/CatalogProvider";
import { getTheme } from "@/data/themes";
import type { Locale } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";
import { applyTheme } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { continueAfterTryUrl } from "@/lib/tryInvite";

function Bar({ slug, locale: localeProp }: { slug: string; locale?: Locale }) {
  const contextLocale = useLocale();
  const locale = localeProp ?? contextLocale;
  const en = locale === "en";
  const cat = useCatalog();
  const params = useSearchParams();
  const [signedIn, setSignedIn] = useState(false);
  const trying = params.get("dene") === "1" && params.get("taslak") === "1";
  const theme = useMemo(() => {
    const base = getTheme(slug);
    return base ? applyTheme(base, cat) : null;
  }, [slug, cat]);

  useEffect(() => {
    if (!trying || !supabaseConfigured()) return;
    let live = true;
    let unsubscribe = () => {};
    try {
      const supabase = createSupabaseBrowser();
      supabase.auth.getUser()
        .then(({ data }) => {
          if (live) setSignedIn(Boolean(data.user));
        })
        .catch(() => undefined);
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (live) setSignedIn(Boolean(session?.user));
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      /* no supabase config */
    }
    return () => {
      live = false;
      unsubscribe();
    };
  }, [trying]);

  if (!trying) return null;
  if (!theme) return null;
  const href = continueAfterTryUrl(slug, locale, signedIn);
  const priceLabel = formatTL(theme.price, locale);

  return (
    <div className="try-bar" role="region" aria-label={en ? "Continue with this design" : "Bu tasarımla devam et"}>
      <div className="try-bar__inner">
        <div className="try-bar__copy">
          <strong>
            {signedIn
              ? en
                ? "Your names and date are ready"
                : "İsimleriniz ve tarihiniz hazır"
              : en
                ? "Liked it with your names?"
                : "İsimlerinizle beğendiniz mi?"}
          </strong>
          <span className="muted">
            {signedIn
              ? en
                ? "Continue editing your invitation."
                : "Davetiyenizi düzenlemeye devam edin."
              : en
                ? "Create a free account and keep editing this design."
                : "Ücretsiz hesap oluşturun, aynı tasarımla düzenlemeye devam edin."}
          </span>
        </div>
        <Link href={href} className="btn btn--dark btn--lg try-bar__cta" data-track="try-continue">
          {en
            ? `Continue with this design · ${priceLabel}`
            : `Bu tasarımla devam et · ${priceLabel}`}
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
