import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import NewspaperCard from "@/components/NewspaperCard";
import NewspaperCover from "@/components/NewspaperCover";
import SectionHead from "@/components/SectionHead";
import { getNewspaper, newspapers } from "@/data/newspapers";
import { NEWSPAPER_FEATURES } from "@/data/site";
import { applyNewspaper } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { getPublicCatalog } from "@/lib/store";

export function generateStaticParams() {
  return newspapers.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getNewspaper(slug);
  return p ? { title: p.title, description: p.eyebrow } : { title: "Gazete bulunamadı" };
}

const BENEFITS: { icon: IconName; t: string; d: string }[] = [
  { icon: "print", t: "Dijital + baskı", d: "Sayfa çevirme ve A3/A2 baskı" },
  { icon: "wallet", t: "Tek seferlik ödeme", d: "Abonelik yok" },
  { icon: "type", t: "Siz yazarsınız", d: "Kapak, manşet ve hikâye alanları" },
];

export default async function NewspaperDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = getNewspaper(slug);
  if (!found) notFound();
  const cat = await getPublicCatalog();
  const paper = applyNewspaper(found, cat);
  const others = newspapers.filter((n) => n.slug !== slug && !cat.newspapers[n.slug]?.hidden).slice(0, 4).map((n) => applyNewspaper(n, cat));
  const save = Math.round(((paper.compareAt - paper.price) / paper.compareAt) * 100);

  return (
    <>
      <section className="detail">
        <div className="wrap wrap--lg">
          <nav aria-label="Sayfa yolu">
            <ol className="breadcrumb">
              <li><Link href="/tr" aria-label="Ana sayfa"><Icon name="home" size={14} /></Link></li>
              <li><Link href="/tr/gazeteler">Gazeteler</Link></li>
              <li aria-current="page">{paper.title}</li>
            </ol>
          </nav>

          <div className="detail__grid">
            <div className="detail__copy">
              <p className="eyebrow eyebrow--rule">{paper.eyebrow}</p>
              <h1 className="detail__title">{paper.title}</h1>
              <p className="detail__desc">{paper.description}</p>
              <div className="detail__price">
                <strong className="num">{formatTL(paper.price)}</strong>
                <s className="num">{formatTL(paper.compareAt)}</s>
                <span className="pcard__off">%{save} İndirim</span>
              </div>
              <div className="detail__cta">
                <Link href={`/tr/gazete-tasarla?sablon=${paper.slug}`} className="btn btn--dark btn--lg btn--serif">
                  Bu Gazeteyle Başla <Icon name="arrow" size={16} />
                </Link>
                <Link href={`/times/sablon/${paper.slug}`} className="btn btn--outline btn--lg btn--serif">
                  <Icon name="expand" size={16} /> Sayfa Çevirmeli Önizleme
                </Link>
              </div>
              <ul className="benefits">
                {BENEFITS.map((b) => (
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
          <SectionHead id="inc-h" title="Gazeteye dahil olanlar" />
          <ul className="offer-grid">
            {NEWSPAPER_FEATURES.map((f) => (
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
          <SectionHead id="oth-h" title="Diğer gazete şablonları" />
          <div className="card-grid card-grid--news">
            {others.map((p) => <NewspaperCard key={p.slug} paper={p} />)}
          </div>
        </div>
      </section>
    </>
  );
}
