import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewspaperFlip from "@/components/NewspaperFlip";
import TimesReader from "@/components/TimesReader";
import { getNewspaper, newspapers } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { loadTimesDesign } from "@/lib/times";

export function generateStaticParams() {
  return newspapers.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
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

export default async function NewspaperPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const found = getNewspaper(slug);
  if (!found) notFound();
  const paper = localizeNewspaper(found, locale);

  const design = loadTimesDesign(slug);
  if (design) {
    return <TimesReader data={design} slug={slug} />;
  }

  return (
    <main id="main">
      <NewspaperFlip paper={paper} backHref={lp(locale, `/gazeteler/${paper.slug}`)} />
    </main>
  );
}
