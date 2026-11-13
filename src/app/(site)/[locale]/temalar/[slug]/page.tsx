import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FavoriteButton from "@/components/FavoriteButton";
import Icon, { type IconName } from "@/components/Icon";
import ProductCard from "@/components/ProductCard";
import SectionHead from "@/components/SectionHead";
import ThemePhonePreview from "@/components/ThemePhonePreview";
import JsonLd from "@/components/JsonLd";
import { ADDONS } from "@/data/pricing";
import { discountPercent, getTheme, similarThemes, themes } from "@/data/themes";
import { localizeTheme } from "@/i18n/catalog";
import { isLocale, LOCALES, lp, type Locale } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { invitationSections, localizeAddon } from "@/i18n/product";
import { applyTheme } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { breadcrumbJsonLd, pageMeta, productJsonLd } from "@/lib/seo";
import { getPublicCatalog } from "@/lib/store";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => themes.map((t) => ({ locale, slug: t.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTheme(slug);
  if (!t) return {};
  const theme = localizeTheme(t, locale);
  return pageMeta({
    title: locale === "en" ? `${theme.title} digital invitation` : `${theme.title} dijital davetiyesi`,
    description: theme.description || theme.eyebrow,
    path: lp(locale, `/temalar/${theme.slug}`),
    image: theme.heroCover || theme.cover,
  });
}

function benefits(locale: Locale): { icon: IconName; title: string; text: string }[] {
  if (locale === "en") {
    return [
      { icon: "phone", title: "Mobile-friendly", text: "Opens on every phone and in every browser" },
      { icon: "share", title: "Instant sharing", text: "Invite people easily with a single link" },
      { icon: "sliders", title: "Easy to customise", text: "Edit it to fit your own story" },
    ];
  }
  return [
    { icon: "phone", title: "Mobil uyumlu", text: "Her telefonda ve tarayıcıda açılır" },
    { icon: "share", title: "Anında paylaşım", text: "Tek bağlantıyla kolayca davet edin" },
    { icon: "sliders", title: "Kolay özelleştirme", text: "Kendi hikâyenize göre düzenleyin" },
  ];
}

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const base = getTheme(slug);
  if (!base) notFound();
  const cat = await getPublicCatalog();
  const theme = localizeTheme(applyTheme(base, cat), locale);
  const discount = discountPercent(theme);
  const similar = similarThemes(base, 6)
    .map((t) => localizeTheme(applyTheme(t, cat), locale))
    .filter((t) => !cat.themes[t.slug]?.hidden)
    .slice(0, 4);
  const wall = localizeAddon(
    ADDONS.find((a) => a.id === "ani-duvari") ?? { id: "ani-duvari", title: "Anı Duvarı", text: "", price: 159 },
    locale,
  );
  const sections = invitationSections(locale);
  const addonTag = marketing(locale).addonTag;
  const home = lp(locale);
  const catalog = lp(locale, "/temalar");
  const path = lp(locale, `/temalar/${theme.slug}`);

  return (
    <>
      <JsonLd
        data={[
          productJsonLd({
            name: en ? `${theme.title} digital invitation` : `${theme.title} dijital davetiyesi`,
            description: theme.description || theme.eyebrow,
            path,
            image: theme.heroCover || theme.cover,
            price: theme.price,
          }),
          breadcrumbJsonLd([
            { name: en ? "Home" : "Ana sayfa", path: home },
            { name: en ? "Invitations" : "Davetiyeler", path: catalog },
            { name: theme.title, path },
          ]),
        ]}
      />
      <section className="detail">
        <Image src="/img/decor/bouquet-tr.webp" alt="" width={420} height={520} className="detail__decor" aria-hidden="true" />
        <div className="wrap wrap--lg">
          <nav aria-label={en ? "Breadcrumb" : "Davetiyeler"}>
            <ol className="breadcrumb">
              <li><Link href={home} aria-label={en ? "Home" : "Ana sayfa"}><Icon name="home" size={14} /></Link></li>
              <li><Link href={catalog}>{en ? "Invitations" : "Davetiyeler"}</Link></li>
              <li aria-current="page">{theme.title}</li>
            </ol>
          </nav>

          <div className="detail__grid">
            <div className="detail__copy">
              <p className="eyebrow eyebrow--rule">{theme.eyebrow}</p>
              {theme.badge && (
                <span className={`pbadge pbadge--${theme.badge}`}>
                  <Icon name={theme.badge === "featured" ? "star" : "sparkle"} size={11} />
                  {theme.badge === "featured" ? (en ? "Featured" : "Öne çıkan") : (en ? "New" : "Yeni")}
                </span>
              )}
              <h1 className="detail__title">
                {theme.title}
                <FavoriteButton slug={theme.slug} title={theme.title} />
              </h1>
              <p className="detail__desc">{theme.description}</p>

              <div className="detail__price">
                <strong>{formatTL(theme.price, locale)}</strong>
                {theme.compareAt > theme.price && <s>{formatTL(theme.compareAt, locale)}</s>}
                {discount > 0 && <span className="pcard__off">{en ? `${discount}% off` : `%${discount} İndirim`}</span>}
              </div>

              <div className="detail__cta">
                <Link
                  href={`${lp(locale, "/davetiye-olustur")}?sablon=${encodeURIComponent(theme.slug)}`}
                  className="btn btn--dark btn--lg btn--serif"
                >
                  <Icon name="sparkle" size={16} /> {en ? "Start with this invitation" : "Bu Davetiyeyle Başla"} <Icon name="arrow" size={16} />
                </Link>
                <Link href={`/onizleme/tema/${theme.slug}`} className="btn btn--outline btn--lg btn--serif">
                  <Icon name="expand" size={16} /> {en ? "Full-screen preview" : "Tam Ekran Önizle"}
                </Link>
              </div>

              <ul className="benefits">
                {benefits(locale).map((b) => (
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
                <p className="included__title">{en ? "Included with this invitation" : "Bu davetiyeye dahil"}</p>
                <ul>
                  <li>
                    <span><Icon name="check" size={14} /> {wall.title}</span>
                    <s>{formatTL(wall.price, locale)}</s>
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
            eyebrow={en ? "Sections" : "Bölümler"}
            id="sections-title"
            title={en ? "What you can use on this invitation" : "Bu davetiyede kullanabilecekleriniz"}
            lead={
              en
                ? "This invitation includes the sections below. You can turn the optional ones on or off as you like."
                : "Bu davetiyede aşağıdaki bölümler yer alır; isteğe bağlı olanları dilediğiniz gibi açıp kapatabilirsiniz."
            }
          />
          <ul className="sections-grid">
            {sections.map((s) => (
              <li key={s.id} className="sec-item">
                <span className="sec-item__icon"><Icon name="check" size={14} /></span>
                <div>
                  <h3>
                    {s.title}
                    {s.addon && <span className="tag-addon">{addonTag}</span>}
                  </h3>
                  <p>{s.text}</p>
                </div>
                <span className="sec-item__opt">{en ? "Optional" : "İsteğe bağlı"}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="similar-title">
        <div className="wrap">
          <SectionHead
            eyebrow={en ? "Chosen for you" : "Sizin için seçtik"}
            id="similar-title"
            title={en ? "Similar invitations" : "Benzer davetiyeler"}
            lead={en ? "Have a look at other invitations in a similar style." : "Benzer tarzdaki diğer davetiyelere de göz atın."}
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
