import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewspaperFlip from "@/components/NewspaperFlip";
import TimesReader from "@/components/TimesReader";
import { getNewspaper, newspapers } from "@/data/newspapers";
import { loadTimesDesign } from "@/lib/times";

export function generateStaticParams() {
  return newspapers.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getNewspaper(slug);
  return {
    title: p ? `${p.title} · gazete` : "Gazete bulunamadı",
    robots: { index: false, follow: false },
  };
}

export default async function NewspaperPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = getNewspaper(slug);
  if (!paper) notFound();

  const design = loadTimesDesign(slug);
  if (design) {
    return <TimesReader data={design} slug={slug} />;
  }

  return (
    <main id="main">
      <NewspaperFlip paper={paper} backHref={`/tr/gazeteler/${paper.slug}`} />
    </main>
  );
}
