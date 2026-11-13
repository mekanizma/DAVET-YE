import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { FREE_SECTIONS, PRICE_BAND_SAMPLES, PRICE_BAND_SLUGS } from "@/data/pricing";
import { themes } from "@/data/themes";
import { localizeTheme } from "@/i18n/catalog";
import { isLocale, lp } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { freeSections, localizeAddons, priceFeatures } from "@/i18n/product";
import { applyTheme, startingPrice } from "@/lib/catalog";
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
    title: en ? "Digital invitation prices" : "Dijital davetiye fiyatları",
    description: en
      ? "The invitation price is paid once and covers every section. There is no subscription. You buy add-ons only if you need them."
      : "Davetiye fiyatı tek seferliktir ve bütün bölümleri kapsar. Abonelik yok; eklentileri yalnızca ihtiyacınız varsa alırsınız.",
    path: lp(locale, "/fiyatlar"),
  });
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const copy = marketing(locale);
  const cat = await getPublicCatalog();
  const live = themes
    .map((t) => localizeTheme(applyTheme(t, cat), locale))
    .filter((t) => !cat.themes[t.slug]?.hidden);
  const minPrice = startingPrice(cat);
  const addons = localizeAddons(
    cat.addons.filter((a) => a.active),
    locale,
  );
  const bands = Array.from(new Set(live.map((t) => t.price))).sort((a, b) => a - b);
  const features = priceFeatures(locale, cat.features);
  const included = freeSections(locale, FREE_SECTIONS);
  return (
    <>
      <section className="section section--tight">
        <div className="wrap">
          <div className="page-title page-title--center">
            <p className="eyebrow">{en ? "Clear pricing" : "Şeffaf fiyat"}</p>
            <h1>{en ? "A one-time payment, with no subscription" : "Tek seferlik ödeme, abonelik yok"}</h1>
            <p>
              {en
                ? "The invitation price is paid once and covers every section. You buy add-ons only if you need them, and you can add them later."
                : "Davetiyenin fiyatı tek seferliktir ve bütün bölümleri kapsar. Eklentileri yalnızca ihtiyacınız varsa alırsınız; sonradan da ekleyebilirsiniz."}
            </p>
          </div>

          <div className="price-grid price-grid--page">
            <div className="price-card">
              <p className="price-card__eyebrow">{en ? "Invitation" : "Davetiye"}</p>
              <p className="price-card__eyebrow price-card__eyebrow--sub">{en ? "Starting price" : "Başlangıç fiyatı"}</p>
              <p className="price-card__amount">
                {new Intl.NumberFormat(en ? "en-GB" : "tr-TR").format(minPrice)} <span>TL</span>
              </p>
              <p className="price-card__text">
                {en
                  ? "The price of the invitation you choose, with every section included."
                  : "Seçtiğiniz davetiyenin fiyatı; davetiyedeki bütün bölümler dahil."}
              </p>
              <ul className="price-card__list">
                {features.map((x) => (
                  <li key={x}>
                    <span className="tick tick--gold"><Icon name="check" size={12} /></span>
                    {x}
                  </li>
                ))}
              </ul>
              <Link href={lp(locale, "/temalar")} className="btn btn--gold btn--block">
                {en ? "Browse invitations" : "Davetiyeleri İncele"} <Icon name="arrow" size={14} />
              </Link>
            </div>

            <div className="addons" aria-labelledby="addons-h">
              <h2 id="addons-h" className="addons__title">{en ? "Add-ons" : "Eklentiler"}</h2>
              <p className="addons__lead">
                {en ? "Add only what you need. None of them is required." : "İhtiyacınız kadarını ekleyin; hiçbiri zorunlu değil."}
              </p>
              <ul>
                {addons.length === 0 ? (
                  <li>{en ? "No add-ons are available at the moment." : "Şu an eklenti yok."}</li>
                ) : (
                  addons.map((a) => (
                    <li key={a.id} className="addon">
                      <div className="addon__text">
                        <h3 className="addon__h">
                          {a.title}
                          {a.note && <span className="addon__note"> · {a.note}</span>}
                        </h3>
                        <p>{a.text}</p>
                      </div>
                      <strong className="addon__price">
                        {a.was && <s>{formatTL(a.was, locale)}</s>}
                        {a.price === 0 ? copy.free : formatTL(a.price, locale)}
                      </strong>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--alt section--tight" aria-labelledby="free-h">
        <div className="wrap wrap--sm">
          <h2 id="free-h" className="center-h">{en ? "Included sections" : "Ücretsiz Bölümler"}</h2>
          <p className="center-p">
            {en
              ? "Sections that come with an invitation at no extra charge. Each invitation’s page lists which sections are included."
              : "Davetiyelerde ek ücret olmadan yer alan bölümler; hangi bölümlerin dahil olduğu her davetiyenin sayfasında yazar."}
          </p>
          <ul className="free-list">
            {included.map((s) => (
              <li key={s}>
                <span className="tick"><Icon name="check" size={12} /></span> {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="bands-h">
        <div className="wrap wrap--sm">
          <p className="eyebrow center-eyebrow">{en ? "Price bands" : "Fiyat bantları"}</p>
          <h2 id="bands-h" className="center-h">
            {en ? "How many invitations are there at each price?" : "Hangi fiyatta kaç davetiye var?"}
          </h2>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">
                {en ? "Invitation counts and examples by price band" : "Fiyat bantlarına göre davetiye sayısı ve örnekler"}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{en ? "Price" : "Fiyat"}</th>
                  <th scope="col">{en ? "Invitations" : "Davetiye"}</th>
                  <th scope="col">{en ? "Example" : "Örnek"}</th>
                  <th scope="col">{en ? "View" : "İncele"}</th>
                </tr>
              </thead>
              <tbody>
                {bands.length === 0 ? (
                  <tr>
                    <td colSpan={4}>{en ? "No invitations are listed at the moment." : "Şu an listelenen davetiye yok."}</td>
                  </tr>
                ) : (
                  bands.map((price) => {
                    const count = live.filter((t) => t.price === price).length;
                    const slug = PRICE_BAND_SLUGS[price] ?? live.find((t) => t.price === price)?.slug ?? "";
                    const row = live.find((t) => t.slug === slug);
                    const source = themes.find((t) => t.slug === slug);
                    const shown = source ? localizeTheme(applyTheme(source, cat), locale) : row;
                    const title = row?.title ?? slug;
                    const sample = en ? (shown ? `${shown.title} — ${shown.eyebrow}` : title) : (PRICE_BAND_SAMPLES[price] ?? title);
                    return (
                      <tr key={price}>
                        <th scope="row" className="num">{formatTL(price, locale)}</th>
                        <td className="num">{count}</td>
                        <td>{sample}</td>
                        <td>
                          <Link href={lp(locale, `/temalar/${slug}`)} className="link-arrow" aria-label={en ? `View: ${title}` : `İncele: ${title}`}>
                            {en ? "View" : "İncele"} <Icon name="arrow" size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="page-cta">
            <h2>{en ? "See the price, line by line, in the invitation builder" : "Fiyatı davetiye oluşturucuda satır satır görün"}</h2>
            <p>
              {en
                ? "Every add-on you choose appears in the price summary at once. There are no surprises."
                : "Seçtiğiniz her eklenti fiyat özetine anında yansır; sürpriz yok."}
            </p>
            <Link href={lp(locale, "/davetiye-olustur")} className="btn btn--dark btn--lg btn--serif">
              {en ? "Start now" : "Hemen Başla"} <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
