import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import NewspaperCard from "@/components/NewspaperCard";
import NewspaperCover from "@/components/NewspaperCover";
import SectionHead from "@/components/SectionHead";
import JsonLd from "@/components/JsonLd";
import { getNewspaper, newspapers } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { isLocale, LOCALES, lp, type Locale } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { applyNewspaper } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { breadcrumbJsonLd, pageMeta, productJsonLd } from "@/lib/seo";
import { getPublicCatalog } from "@/lib/store";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => newspapers.map((n) => ({ locale, slug: n.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const p = getNewspaper(slug);
  if (!p) return { title: locale === "en" ? "Newspaper not found" : "Gazete bulunamadı" };
  const paper = localizeNewspaper(p, locale);
  return pageMeta({
    title: locale === "en" ? `${paper.title} wedding newspaper` : `${paper.title} düğün gazetesi`,
    description: paper.description,
    path: lp(locale, `/gazeteler/${paper.slug}`),
    image: paper.cover,
  });
}

function benefits(locale: Locale): { icon: IconName; t: string; d: string }[] {
  if (locale === "en") {
    return [
      { icon: "print", t: "Digital and print", d: "Page turning, and A3 or A2 print" },
      { icon: "wallet", t: "One-time payment", d: "No subscription" },
      { icon: "type", t: "You write it", d: "Cover, headline, and story" },
    ];
  }
  return [
    { icon: "print", t: "Dijital + baskı", d: "Sayfa çevirme ve A3/A2 baskı" },
    { icon: "wallet", t: "Tek seferlik ödeme", d: "Abonelik yok" },
    { icon: "type", t: "Siz yazarsınız", d: "Kapak, manşet ve hikâye alanları" },
  ];
}

export default async function NewspaperDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const found = getNewspaper(slug);
  if (!found) notFound();
  const cat = await getPublicCatalog();
  const paper = localizeNewspaper(applyNewspaper(found, cat), locale);
  const others = newspapers
    .filter((n) => n.slug !== slug && !cat.newspapers[n.slug]?.hidden)
    .slice(0, 4)
    .map((n) => localizeNewspaper(applyNewspaper(n, cat), locale));
  const save = Math.round(((paper.compareAt - paper.price) / paper.compareAt) * 100);
  const home = lp(locale);
  const catalog = lp(locale, "/gazeteler");
  const path = lp(locale, `/gazeteler/${paper.slug}`);

  return (
    <>
      <JsonLd
        data={[
          productJsonLd({
            name: en ? `${paper.title} wedding newspaper` : `${paper.title} düğün gazetesi`,
            description: paper.description,
            path,
            image: paper.cover,
            price: paper.price,
          }),
          breadcrumbJsonLd([
            { name: en ? "Home" : "Ana sayfa", path: home },
            { name: en ? "Newspapers" : "Gazeteler", path: catalog },
            { name: paper.title, path },
          ]),
        ]}
      />
      <section className="detail">
        <div className="wrap wrap--lg">
          <nav aria-label={en ? "Breadcrumb" : "Sayfa yolu"}>
            <ol className="breadcrumb">
              <li><Link href={home} aria-label={en ? "Home" : "Ana sayfa"}><Icon name="home" size={14} /></Link></li>
              <li><Link href={catalog}>{en ? "Newspapers" : "Gazeteler"}</Link></li>
              <li aria-current="page">{paper.title}</li>
            </ol>
          </nav>

          <div className="detail__grid">
            <div className="detail__copy">
              <p className="eyebrow eyebrow--rule">{paper.eyebrow}</p>
              <h1 className="detail__title">{paper.title}</h1>
              <p className="detail__desc">{paper.description}</p>
              <div className="detail__price">
                <strong className="num">{formatTL(paper.price, locale)}</strong>
                <s className="num">{formatTL(paper.compareAt, locale)}</s>
                <span className="pcard__off">{en ? `${save}% off` : `%${save} İndirim`}</span>
              </div>
              <div className="detail__cta">
                <Link href={`${lp(locale, "/gazete-tasarla")}?sablon=${encodeURIComponent(paper.slug)}`} className="btn btn--dark btn--lg btn--serif">
                  {en ? "Start with this newspaper" : "Bu Gazeteyle Başla"} <Icon name="arrow" size={16} />
                </Link>
                <Link href={`/times/sablon/${paper.slug}`} className="btn btn--outline btn--lg btn--serif">
                  <Icon name="expand" size={16} /> {en ? "Page-turning preview" : "Sayfa Çevirmeli Önizleme"}
                </Link>
              </div>
              <ul className="benefits">
                {benefits(locale).map((b) => (
                  <li key={b.t}>
                    <span className="benefits__icon"><Icon name={b.icon} size={16} /></span>
                    <span>
                      <strong>{b.t}</strong>
                      <small>{b.d}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="np-detail__media">
              <NewspaperCover paper={paper} sizes="(max-width: 800px) 90vw, 460px" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--alt section--tight" aria-labelledby="inc-h">
        <div className="wrap">
          <SectionHead id="inc-h" title={en ? "Included with the newspaper" : "Gazeteye dahil olanlar"} />
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

      <section className="section section--tight" aria-labelledby="oth-h">
        <div className="wrap wrap--lg">
          <SectionHead id="oth-h" title={en ? "Other newspaper templates" : "Diğer gazete şablonları"} />
          <div className="card-grid card-grid--news">
            {others.map((p) => <NewspaperCard key={p.slug} paper={p} />)}
          </div>
        </div>
      </section>
    </>
  );
}
