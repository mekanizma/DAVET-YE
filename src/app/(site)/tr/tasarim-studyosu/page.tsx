import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import SectionHead from "@/components/SectionHead";
import DesignCard from "@/components/studio/DesignCard";
import StudioHero from "@/components/studio/StudioHero";
import { DESIGN_CATEGORIES, designPresets, stateFromPreset } from "@/data/designs";
import { DESIGN_PRICING } from "@/data/pricing";
import { formatTL } from "@/lib/format";
import { getPublicCatalog } from "@/lib/store";

export const metadata: Metadata = {
  title: "KendinTasarla — davetiye kartınızı kendiniz tasarlayın",
  description: "Hazır bir tasarımdan başlayın ya da boş sayfadan; telefonda ve bilgisayarda düzenleyin, baskıya hazır dosya alın.",
};

const CAT_TABS = [{ key: "all", name: "Tümü" }, ...DESIGN_CATEGORIES];

const FEATURES: { icon: IconName; t: string; d: string }[] = [
  { icon: "doc", t: "Hazır tasarımlar", d: "Seçin, dilediğiniz gibi değiştirin" },
  { icon: "sliders", t: "Kolay düzenleme", d: "Telefonda ve bilgisayarda" },
  { icon: "print", t: "Baskıya hazır dosyalar", d: "PNG ve yüksek çözünürlüklü çıktı" },
  { icon: "gift", t: "Müşterilerimize ücretsiz", d: "Davetiye ya da gazete alanlara" },
];

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const studioPrice = (await getPublicCatalog()).studioPrice;
  const sp = await searchParams;
  const cat = CAT_TABS.some((c) => c.key === sp.cat) ? (sp.cat as string) : "all";
  const list = cat === "all" ? designPresets : designPresets.filter((d) => d.categoryKey === cat);

  return (
    <>
      <section className="page-hero studio-hero">
        <Image src="/img/decor/floral-tl.webp" alt="" width={520} height={520} className="page-hero__decor page-hero__decor--l" aria-hidden="true" />
        <Image src="/img/decor/bouquet-tr.webp" alt="" width={420} height={520} className="page-hero__decor" aria-hidden="true" />
        <div className="wrap wrap--lg studio-hero__grid">
          <div className="page-hero__inner">
            <p className="eyebrow eyebrow--rule">KendinTasarla</p>
            <h1 className="page-hero__title">
              Davetiye kartınızı <em>kendiniz tasarlayın</em>
            </h1>
            <div className="hero-actions">
              <Link href="/tr/tasarla" className="btn btn--dark btn--lg btn--serif">
                Tasarlamaya başlayın <Icon name="arrow" size={16} />
              </Link>
              <a href="#hazir-tasarimlar" className="btn btn--outline btn--lg btn--serif">Hazır tasarımlar</a>
            </div>
            <ul className="trust-list">
              {[`${designPresets.length} hazır tasarım`, "Telefonda ve bilgisayarda", "Baskıya hazır dosya"].map((t) => (
                <li key={t}><span className="tick tick--gold"><Icon name="check" size={11} /></span>{t}</li>
              ))}
            </ul>
          </div>
          <StudioHero />
        </div>
      </section>

      <section className="section section--tight" aria-label="KendinTasarla'da neler var">
        <div className="wrap">
          <ul className="feature-strip">
            {FEATURES.map((f) => (
              <li key={f.t}>
                <span className="feature-strip__icon"><Icon name={f.icon} size={18} /></span>
                <span><strong>{f.t}</strong><small>{f.d}</small></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="hazir-tasarimlar" className="section section--alt" aria-labelledby="ready-h">
        <div className="wrap wrap--lg">
          <SectionHead id="ready-h" eyebrow="Başlangıç noktanız" title="Hazır tasarımlar" />
          <nav className="studio-cats" aria-label="Tasarım kategorileri">
            {CAT_TABS.map((c) => {
              const href =
                c.key === "all"
                  ? "/tr/tasarim-studyosu#hazir-tasarimlar"
                  : `/tr/tasarim-studyosu?cat=${c.key}#hazir-tasarimlar`;
              return (
                <Link
                  key={c.key}
                  href={href}
                  className={`studio-cats__btn${cat === c.key ? " is-on" : ""}`}
                  aria-current={cat === c.key ? "page" : undefined}
                >
                  {c.name}
                </Link>
              );
            })}
          </nav>
          <p className="studio-cats__count">{list.length} tasarım</p>
          <ul className="studio-grid">
            <li>
              <Link href="/tr/tasarla" className="studio-tile studio-tile--blank">
                <span className="studio-tile__plus"><Icon name="plus" size={26} /></span>
                <strong>Boş sayfadan başlayın</strong>
                <small>Ölçüyü siz seçin</small>
              </Link>
            </li>
            {list.map((p) => (
              <li key={p.id}>
                <Link href={`/tr/tasarla?tasarim=${encodeURIComponent(p.id)}`} className="studio-tile" aria-label={`${p.name}, ${p.category}. Bu tasarımla başlayın`}>
                  <div className="studio-tile__art"><DesignCard design={stateFromPreset(p)} /></div>
                  <strong>{p.name}</strong>
                  <small>{p.category}</small>
                  <span className="studio-tile__cta">Bu tasarımla başlayın <Icon name="arrow" size={12} /></span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="studio-note">
            Davetiyemgo hazır stüdyo koleksiyonunun tamamı senkronlandı: {designPresets.length} tasarım.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="price-h">
        <div className="wrap wrap--sm">
          <SectionHead id="price-h" eyebrow="Fiyat" title="Tasarlamak her zaman ücretsiz" />
          <div className="studio-prices">
            {[DESIGN_PRICING.free, { ...DESIGN_PRICING.paid, price: studioPrice === 0 ? "Ücretsiz" : formatTL(studioPrice) }].map((p) => (
              <article key={p.title} className="studio-price">
                <h3>{p.title}</h3>
                <p className="studio-price__amount">{p.price}</p>
                <p className="studio-price__cap">{p.caption}</p>
                <ul>
                  {p.items.map((x) => (
                    <li key={x}><span className="tick"><Icon name="check" size={11} /></span>{x}</li>
                  ))}
                </ul>
                <Link href="/tr/tasarla" className="btn btn--outline btn--block">Tasarlamaya başlayın</Link>
              </article>
            ))}
          </div>
          <p className="studio-note">Davetiye ya da gazete satın aldıysanız filigransız indirme sizin için ücretsiz.</p>
        </div>
      </section>

      <section className="final-lite">
        <div className="wrap wrap--sm">
          <p className="eyebrow eyebrow--gold">HAZIRSANIZ</p>
          <h2>Kartınızı birkaç dakikada hazırlayın</h2>
          <Link href="/tr/tasarla" className="btn btn--gold btn--lg">Tasarlamaya başlayın <Icon name="arrow" size={16} /></Link>
        </div>
      </section>
    </>
  );
}
