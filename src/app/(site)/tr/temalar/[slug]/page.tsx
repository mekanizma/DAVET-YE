import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FavoriteButton from "@/components/FavoriteButton";
import Icon from "@/components/Icon";
import ProductCard from "@/components/ProductCard";
import SectionHead from "@/components/SectionHead";
import ThemePhonePreview from "@/components/ThemePhonePreview";
import { INVITATION_SECTIONS } from "@/data/sections";
import { discountPercent, getTheme, similarThemes, themes } from "@/data/themes";
import { applyTheme } from "@/lib/catalog";
import JsonLd from "@/components/JsonLd";
import { formatTL } from "@/lib/format";
import { breadcrumbJsonLd, pageMeta, productJsonLd } from "@/lib/seo";
import { getPublicCatalog } from "@/lib/store";

export function generateStaticParams() {
  return themes.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getTheme(slug);
  if (!t) return {};
  return pageMeta({
    title: `${t.title} dijital davetiyesi`,
    description: t.description || t.eyebrow,
    path: `/tr/temalar/${t.slug}`,
    image: t.heroCover || t.cover,
  });
}

const BENEFITS = [
  { icon: "phone", title: "Mobil uyumlu", text: "Her telefonda ve tarayıcıda açılır" },
  { icon: "share", title: "Anında paylaşım", text: "Tek bağlantıyla kolayca davet edin" },
  { icon: "sliders", title: "Kolay özelleştirme", text: "Kendi hikâyenize göre düzenleyin" },
] as const;

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = getTheme(slug);
  if (!base) notFound();
  const cat = await getPublicCatalog();
  const theme = applyTheme(base, cat);
  const discount = discountPercent(theme);
  const similar = similarThemes(base, 6).map((t) => applyTheme(t, cat)).filter((t) => !cat.themes[t.slug]?.hidden).slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          productJsonLd({
            name: `${theme.title} dijital davetiyesi`,
            description: theme.description || theme.eyebrow,
            path: `/tr/temalar/${theme.slug}`,
            image: theme.heroCover || theme.cover,
            price: theme.price,
          }),
          breadcrumbJsonLd([
            { name: "Ana sayfa", path: "/tr" },
            { name: "Davetiyeler", path: "/tr/temalar" },
            { name: theme.title, path: `/tr/temalar/${theme.slug}` },
          ]),
        ]}
      />
      <section className="detail">
        <Image src="/img/decor/bouquet-tr.webp" alt="" width={420} height={520} className="detail__decor" aria-hidden="true" />
        <div className="wrap wrap--lg">
          <nav aria-label="Davetiyeler">
            <ol className="breadcrumb">
              <li><Link href="/tr" aria-label="Ana sayfa"><Icon name="home" size={14} /></Link></li>
              <li><Link href="/tr/temalar">Davetiyeler</Link></li>
              <li aria-current="page">{theme.title}</li>
            </ol>
          </nav>

          <div className="detail__grid">
            <div className="detail__copy">
              <p className="eyebrow eyebrow--rule">{theme.eyebrow}</p>
              {theme.badge && (
                <span className={`pbadge pbadge--${theme.badge}`}>
                  <Icon name={theme.badge === "featured" ? "star" : "sparkle"} size={11} />
                  {theme.badge === "featured" ? "Öne çıkan" : "Yeni"}
                </span>
              )}
              <h1 className="detail__title">
                {theme.title}
                <FavoriteButton slug={theme.slug} title={theme.title} />
              </h1>
              <p className="detail__desc">{theme.description}</p>

              <div className="detail__price">
                <strong>{formatTL(theme.price)}</strong>
                {theme.compareAt > theme.price && <s>{formatTL(theme.compareAt)}</s>}
                {discount > 0 && <span className="pcard__off">%{discount} İndirim</span>}
              </div>

              <div className="detail__cta">
                <Link
                  href={`/tr/davetiye-olustur?sablon=${theme.slug}`}
                  className="btn btn--dark btn--lg btn--serif"
                >
                  <Icon name="sparkle" size={16} /> Bu Davetiyeyle Başla <Icon name="arrow" size={16} />
                </Link>
                <Link href={`/onizleme/tema/${theme.slug}`} className="btn btn--outline btn--lg btn--serif">
                  <Icon name="expand" size={16} /> Tam Ekran Önizle
                </Link>
              </div>

              <ul className="benefits">
                {BENEFITS.map((b) => (
                  <li key={b.title}>
                    <span className="benefits__icon"><Icon name={b.icon} size={16} /></span>
                    <span>
                      <strong>{b.title}</strong>
                      <small>{b.text}</small>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="included">
                <p className="included__title">Bu davetiyeye dahil</p>
                <ul>
                  <li>
                    <span><Icon name="check" size={14} /> Anı Duvarı</span>
                    <s>159 TL</s>
                  </li>
                </ul>
              </div>
            </div>

            <div className="detail__phone">
              <ThemePhonePreview slug={theme.slug} title={theme.title} />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="sections-title">
        <div className="wrap">
          <SectionHead
            eyebrow="Bölümler"
            id="sections-title"
            title="Bu davetiyede kullanabilecekleriniz"
            lead="Bu davetiyede aşağıdaki bölümler yer alır; isteğe bağlı olanları dilediğiniz gibi açıp kapatabilirsiniz."
          />
          <ul className="sections-grid">
            {INVITATION_SECTIONS.map((s) => (
              <li key={s.id} className="sec-item">
                <span className="sec-item__icon"><Icon name="check" size={14} /></span>
                <div>
                  <h3>
                    {s.title}
                    {s.addon && <span className="tag-addon">EKLENTİ</span>}
                  </h3>
                  <p>{s.text}</p>
                </div>
                <span className="sec-item__opt">İsteğe bağlı</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="similar-title">
        <div className="wrap">
          <SectionHead
            eyebrow="Sizin için seçtik"
            id="similar-title"
            title="Benzer davetiyeler"
            lead="Benzer tarzdaki diğer davetiyelere de göz atın."
          />
          <div className="card-grid card-grid--phones card-grid--four">
            {similar.map((t) => (
              <ProductCard key={t.slug} theme={t} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
