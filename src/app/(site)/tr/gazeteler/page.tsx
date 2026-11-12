import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import NewspaperCard from "@/components/NewspaperCard";
import SectionHead from "@/components/SectionHead";
import { newspapers } from "@/data/newspapers";
import { NEWSPAPER_FEATURES } from "@/data/site";
import { applyNewspaper } from "@/lib/catalog";
import { getPublicCatalog } from "@/lib/store";

import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Düğün gazeteleri",
  description: "Hikâyenizi manşete taşıyan, sayfa çevirmeli ve A3/A2 baskıya hazır düğün gazetesi şablonları.",
  path: "/tr/gazeteler",
});

export default async function NewspapersPage() {
  const cat = await getPublicCatalog();
  const list = newspapers.map((n) => applyNewspaper(n, cat)).filter((n) => !cat.newspapers[n.slug]?.hidden);
  return (
    <>
      <section className="page-hero">
        <div className="wrap wrap--lg page-hero__inner">
          <p className="eyebrow">Gazete</p>
          <h1 className="page-hero__title">Hikâyenizi manşete taşıyın</h1>
          <p className="page-hero__lead">
            Dijital olarak sayfa çevirerek okunan, A3/A2 baskıya hazır gazete şablonları. Kapak fotoğrafınız,
            manşetiniz ve hikâyeniz tek sayıda.
          </p>
          <div className="hero-actions">
            <Link href="/tr/gazete-tasarla" className="btn btn--dark btn--serif">
              Gazete Oluştur <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="papers-h">
        <div className="wrap wrap--lg">
          <SectionHead id="papers-h" title="Gazete şablonları" lead={`${list.length} şablon · Her biri sayfa çevirmeli önizlemeyle`} />
          <div className="card-grid card-grid--news">
            {list.map((p) => (
              <NewspaperCard key={p.slug} paper={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt section--tight" aria-labelledby="np-feat-h">
        <div className="wrap">
          <SectionHead id="np-feat-h" title="Gazetelerde neler var?" />
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
    </>
  );
}
