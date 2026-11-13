import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import SectionHead from "@/components/SectionHead";
import DesignCard from "@/components/studio/DesignCard";
import StudioHero from "@/components/studio/StudioHero";
import { DESIGN_CATEGORIES, designPresets, stateFromPreset } from "@/data/designs";
import { studioCategory, studioName } from "@/i18n/catalog";
import { isLocale, lp, type Locale } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { designPricing } from "@/i18n/product";
import { formatTL } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { getPublicCatalog } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return pageMeta({
    title: en ? "Design it yourself — invitation card" : "Kendin Tasarla — davetiye kartı",
    description: en
      ? "Start from a ready-made design, or lay out your invitation card from a blank page, on a phone or a computer."
      : "Hazır bir tasarımdan başlayın ya da boş sayfadan davetiye kartınızı telefonda ve bilgisayarda düzenleyin.",
    path: lp(locale, "/tasarim-studyosu"),
  });
}

const FEATURES: Record<Locale, { icon: IconName; t: string; d: string }[]> = {
  tr: [
    { icon: "doc", t: "Hazır tasarımlar", d: "Seçin, dilediğiniz gibi değiştirin" },
    { icon: "sliders", t: "Kolay düzenleme", d: "Telefonda ve bilgisayarda" },
    { icon: "print", t: "Baskıya hazır dosyalar", d: "PNG ve yüksek çözünürlüklü çıktı" },
    { icon: "gift", t: "Müşterilerimize ücretsiz", d: "Davetiye ya da gazete alanlara" },
  ],
  en: [
    { icon: "doc", t: "Ready-made designs", d: "Choose one and change it as you like" },
    { icon: "sliders", t: "Easy editing", d: "On a phone and on a computer" },
    { icon: "print", t: "Print-ready files", d: "PNG and a high-resolution file" },
    { icon: "gift", t: "Free for our customers", d: "When you buy an invitation or a newspaper" },
  ],
};

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const studioPrice = (await getPublicCatalog()).studioPrice;
  const sp = await searchParams;
  const tabs = [
    { key: "all", name: en ? "All" : "Tümü" },
    ...DESIGN_CATEGORIES.map((c) => ({ key: c.key, name: studioCategory(c.key, c.name, locale) })),
  ];
  const cat = tabs.some((c) => c.key === sp.cat) ? (sp.cat as string) : "all";
  const list = cat === "all" ? designPresets : designPresets.filter((d) => d.categoryKey === cat);
  const prices = designPricing(locale, studioPrice === 0 ? marketing(locale).free : formatTL(studioPrice, locale));
  const cards = [prices.free, prices.paid];
  const countLabel = en ? `${list.length} ${list.length === 1 ? "design" : "designs"}` : `${list.length} tasarım`;
  const startHref = lp(locale, "/tasarla");

  return (
    <>
      <section className="page-hero studio-hero">
        <Image src="/img/decor/floral-tl.webp" alt="" width={520} height={520} className="page-hero__decor page-hero__decor--l" aria-hidden="true" />
        <Image src="/img/decor/bouquet-tr.webp" alt="" width={420} height={520} className="page-hero__decor" aria-hidden="true" />
        <div className="wrap wrap--lg studio-hero__grid">
          <div className="page-hero__inner">
            <p className="eyebrow eyebrow--rule">{en ? "Design it yourself" : "KendinTasarla"}</p>
            <h1 className="page-hero__title">
              {en ? (
                <>Design your invitation card <em>yourself</em></>
              ) : (
                <>Davetiye kartınızı <em>kendiniz tasarlayın</em></>
              )}
            </h1>
            <div className="hero-actions">
              <Link href={startHref} className="btn btn--dark btn--lg btn--serif">
                {en ? "Start designing" : "Tasarlamaya başlayın"} <Icon name="arrow" size={16} />
              </Link>
              <a href="#hazir-tasarimlar" className="btn btn--outline btn--lg btn--serif">
                {en ? "Ready-made designs" : "Hazır tasarımlar"}
              </a>
            </div>
            <ul className="trust-list">
              {(en
                ? [`${designPresets.length} ready-made designs`, "On a phone and a computer", "A print-ready file"]
                : [`${designPresets.length} hazır tasarım`, "Telefonda ve bilgisayarda", "Baskıya hazır dosya"]
              ).map((t) => (
                <li key={t}><span className="tick tick--gold"><Icon name="check" size={11} /></span>{t}</li>
              ))}
            </ul>
          </div>
          <StudioHero />
        </div>
      </section>

      <section className="section section--tight" aria-label={en ? "What you get when you design it yourself" : "KendinTasarla'da neler var"}>
        <div className="wrap">
          <ul className="feature-strip">
            {FEATURES[locale].map((f) => (
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
          <SectionHead id="ready-h" eyebrow={en ? "Your starting point" : "Başlangıç noktanız"} title={en ? "Ready-made designs" : "Hazır tasarımlar"} />
          <nav className="studio-cats" aria-label={en ? "Design categories" : "Tasarım kategorileri"}>
            {tabs.map((c) => {
              const href =
                c.key === "all"
                  ? `${lp(locale, "/tasarim-studyosu")}#hazir-tasarimlar`
                  : `${lp(locale, "/tasarim-studyosu")}?cat=${encodeURIComponent(c.key)}#hazir-tasarimlar`;
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
          <p className="studio-cats__count">{countLabel}</p>
          <ul className="studio-grid">
            <li>
              <Link href={startHref} className="studio-tile studio-tile--blank">
                <span className="studio-tile__plus"><Icon name="plus" size={26} /></span>
                <strong>{en ? "Start from a blank page" : "Boş sayfadan başlayın"}</strong>
                <small>{en ? "You choose the size" : "Ölçüyü siz seçin"}</small>
              </Link>
            </li>
            {list.map((p) => {
              const name = studioName(p.id, p.name, locale);
              const category = studioCategory(p.categoryKey ?? "", p.category, locale);
              return (
                <li key={p.id}>
                  <Link
                    href={`${startHref}?tasarim=${encodeURIComponent(p.id)}`}
                    className="studio-tile"
                    aria-label={en ? `${name}, ${category}. Start with this design` : `${p.name}, ${p.category}. Bu tasarımla başlayın`}
                  >
                    <div className="studio-tile__art"><DesignCard design={stateFromPreset(p)} /></div>
                    <strong>{name}</strong>
                    <small>{category}</small>
                    <span className="studio-tile__cta">
                      {en ? "Start with this design" : "Bu tasarımla başlayın"} <Icon name="arrow" size={12} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="studio-note">
            {en
              ? `The full ready-made studio collection is synced: ${designPresets.length} designs.`
              : `Davetiyemgo hazır stüdyo koleksiyonunun tamamı senkronlandı: ${designPresets.length} tasarım.`}
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="price-h">
        <div className="wrap wrap--sm">
          <SectionHead id="price-h" eyebrow={en ? "Price" : "Fiyat"} title={en ? "Designing is always free" : "Tasarlamak her zaman ücretsiz"} />
          <div className="studio-prices">
            {cards.map((p) => (
              <article key={p.title} className="studio-price">
                <h3>{p.title}</h3>
                <p className="studio-price__amount">{p.price}</p>
                <p className="studio-price__cap">{p.caption}</p>
                <ul>
                  {p.items.map((x) => (
                    <li key={x}><span className="tick"><Icon name="check" size={11} /></span>{x}</li>
                  ))}
                </ul>
                <Link href={startHref} className="btn btn--outline btn--block">{en ? "Start designing" : "Tasarlamaya başlayın"}</Link>
              </article>
            ))}
          </div>
          <p className="studio-note">
            {en
              ? "If you have bought an invitation or a newspaper, a download without a watermark is free for you."
              : "Davetiye ya da gazete satın aldıysanız filigransız indirme sizin için ücretsiz."}
          </p>
        </div>
      </section>

      <section className="final-lite">
        <div className="wrap wrap--sm">
          <p className="eyebrow eyebrow--gold">{en ? "Ready when you are" : "HAZIRSANIZ"}</p>
          <h2>{en ? "Prepare your card in a few minutes" : "Kartınızı birkaç dakikada hazırlayın"}</h2>
          <Link href={startHref} className="btn btn--gold btn--lg">
            {en ? "Start designing" : "Tasarlamaya başlayın"} <Icon name="arrow" size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
