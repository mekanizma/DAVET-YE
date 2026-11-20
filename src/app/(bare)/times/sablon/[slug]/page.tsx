import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewspaperFlip from "@/components/NewspaperFlip";
import TimesReader from "@/components/TimesReader";
import StudioDraftPreview from "@/components/newspaper/StudioDraftPreview";
import { getNewspaper, newspapers } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { loadTimesDesign } from "@/lib/times";

export function generateStaticParams() {
  return newspapers.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const dil = Array.isArray(sp.dil) ? sp.dil[0] : sp.dil;
  const locale = dil === "en" || dil === "tr" ? dil : await getLocale();
  const p = getNewspaper(slug);
  const named = p ? localizeNewspaper(p, locale) : null;
  return {
    title: named
      ? `${named.title} · ${locale === "en" ? "newspaper" : "gazete"}`
      : locale === "en"
        ? "Newspaper not found"
        : "Gazete bulunamadı",
    robots: { index: false, follow: false },
  };
}

export default async function NewspaperPreview({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const dil = Array.isArray(sp.dil) ? sp.dil[0] : sp.dil;
  const kayit = (Array.isArray(sp.kayit) ? sp.kayit[0] : sp.kayit) === "1";
  const paid = (Array.isArray(sp.odendi) ? sp.odendi[0] : sp.odendi) === "1";
  const fromStudio = (Array.isArray(sp.tasarla) ? sp.tasarla[0] : sp.tasarla) === "1";
  const locale = dil === "en" || dil === "tr" ? dil : await getLocale();
  const found = getNewspaper(slug);
  if (!found) notFound();
  const paper = localizeNewspaper(found, locale);

  const design = loadTimesDesign(slug, locale);
  if (design) {
    if (fromStudio) {
      return <StudioDraftPreview slug={slug} fallback={design} locale={locale} />;
    }
    return <TimesReader data={design} slug={slug} embedded={kayit} locale={locale} />;
  }

  return (
    <main id="main">
      <NewspaperFlip paper={paper} backHref={lp(locale, `/gazeteler/${paper.slug}`)} watermark={!paid} />
    </main>
  );
}
