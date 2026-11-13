import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import NewspaperCard from "@/components/NewspaperCard";
import SectionHead from "@/components/SectionHead";
import { newspapers } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { isLocale, lp } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { applyNewspaper } from "@/lib/catalog";
import { getPublicCatalog } from "@/lib/store";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return pageMeta({
    title: en ? "Wedding newspapers" : "Düğün gazeteleri",
    description: en
      ? "Page-turning wedding newspaper templates, ready for A3 and A2 print, that put your story on the front page."
      : "Hikâyenizi manşete taşıyan, sayfa çevirmeli ve A3/A2 baskıya hazır düğün gazetesi şablonları.",
    path: lp(locale, "/gazeteler"),
  });
}

export default async function NewspapersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const cat = await getPublicCatalog();
  const list = newspapers
    .map((n) => localizeNewspaper(applyNewspaper(n, cat), locale))
    .filter((n) => !cat.newspapers[n.slug]?.hidden);
  const count =
    locale === "en"
      ? `${list.length} ${list.length === 1 ? "template" : "templates"} · Each with a page-turning preview`
      : `${list.length} şablon · Her biri sayfa çevirmeli önizlemeyle`;
  return (
    <>
      <section className="page-hero">
        <div className="wrap wrap--lg page-hero__inner">
          <p className="eyebrow">{en ? "Newspaper" : "Gazete"}</p>
          <h1 className="page-hero__title">{en ? "Put your story on the front page" : "Hikâyenizi manşete taşıyın"}</h1>
          <p className="page-hero__lead">
            {en
              ? "Newspaper templates you read by turning the page, ready for A3 and A2 print. Your cover photograph, your headline, and your story, in a single issue."
              : "Dijital olarak sayfa çevirerek okunan, A3/A2 baskıya hazır gazete şablonları. Kapak fotoğrafınız, manşetiniz ve hikâyeniz tek sayıda."}
          </p>
          <div className="hero-actions">
            <Link href={lp(locale, "/gazete-tasarla")} className="btn btn--dark btn--serif">
              {en ? "Create a newspaper" : "Gazete Oluştur"} <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="papers-h">
        <div className="wrap wrap--lg">
          <SectionHead id="papers-h" title={en ? "Newspaper templates" : "Gazete şablonları"} lead={count} />
          <div className="card-grid card-grid--news">
            {list.map((p) => (
              <NewspaperCard key={p.slug} paper={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt section--tight" aria-labelledby="np-feat-h">
        <div className="wrap">
          <SectionHead id="np-feat-h" title={en ? "What do the newspapers include?" : "Gazetelerde neler var?"} />
          <ul className="offer-grid">
            {marketing(locale).newspaperFeatures.map((f) => (
              <li key={f.title} className="offer-card">
                <span className="offer-card__icon"><Icon name="check" size={16} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
