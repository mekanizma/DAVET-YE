import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import {
  FREE_SECTIONS,
  PRICE_BAND_SAMPLES,
  PRICE_BAND_SLUGS,
} from "@/data/pricing";
import { themes } from "@/data/themes";
import { applyTheme, startingPrice } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { getPublicCatalog } from "@/lib/store";

export const metadata: Metadata = {
  title: "Fiyatlar",
  description: "Davetiyenin fiyatı tek seferliktir ve bütün bölümleri kapsar. Eklentileri yalnızca ihtiyacınız varsa alırsınız.",
};

export default async function PricingPage() {
  const cat = await getPublicCatalog();
  const live = themes.map((t) => applyTheme(t, cat)).filter((t) => !cat.themes[t.slug]?.hidden);
  const minPrice = startingPrice(cat);
  const addons = cat.addons.filter((a) => a.active);
  const bands = Array.from(new Set(live.map((t) => t.price))).sort((a, b) => a - b);
  return (
    <>
      <section className="section section--tight">
        <div className="wrap">
          <div className="page-title page-title--center">
            <p className="eyebrow">Şeffaf fiyat</p>
            <h1>Tek seferlik ödeme, abonelik yok</h1>
            <p>
              Davetiyenin fiyatı tek seferliktir ve bütün bölümleri kapsar. Eklentileri yalnızca
              ihtiyacınız varsa alırsınız; sonradan da ekleyebilirsiniz.
            </p>
          </div>

          <div className="price-grid price-grid--page">
            <div className="price-card">
              <p className="price-card__eyebrow">Davetiye</p>
              <p className="price-card__eyebrow price-card__eyebrow--sub">Başlangıç fiyatı</p>
              <p className="price-card__amount">
                {new Intl.NumberFormat("tr-TR").format(minPrice)} <span>TL</span>
              </p>
              <p className="price-card__text">
                Seçtiğiniz davetiyenin fiyatı; davetiyedeki bütün bölümler dahil.
              </p>
              <ul className="price-card__list">
                {cat.features.map((x) => (
                  <li key={x}>
                    <span className="tick tick--gold"><Icon name="check" size={12} /></span>
                    {x}
                  </li>
                ))}
              </ul>
              <Link href="/tr/temalar" className="btn btn--gold btn--block">
                Davetiyeleri İncele <Icon name="arrow" size={14} />
              </Link>
            </div>

            <div className="addons" aria-labelledby="addons-h">
              <h2 id="addons-h" className="addons__title">Eklentiler</h2>
              <p className="addons__lead">İhtiyacınız kadarını ekleyin; hiçbiri zorunlu değil.</p>
              <ul>
                {addons.map((a) => (
                  <li key={a.id} className="addon">
                    <div className="addon__text">
                      <h3 className="addon__h">
                        {a.title}
                        {a.note && <span className="addon__note"> · {a.note}</span>}
                      </h3>
                      <p>{a.text}</p>
                    </div>
                    <strong className="addon__price">
                      {a.was && <s>{formatTL(a.was)}</s>}
                      {a.price === 0 ? "Ücretsiz" : formatTL(a.price)}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--alt section--tight" aria-labelledby="free-h">
        <div className="wrap wrap--sm">
          <h2 id="free-h" className="center-h">Ücretsiz Bölümler</h2>
          <p className="center-p">
            Davetiyelerde ek ücret olmadan yer alan bölümler; hangi bölümlerin dahil olduğu her
            davetiyenin sayfasında yazar.
          </p>
          <ul className="free-list">
            {FREE_SECTIONS.map((s) => (
              <li key={s}>
                <span className="tick"><Icon name="check" size={12} /></span> {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="bands-h">
        <div className="wrap wrap--sm">
          <p className="eyebrow center-eyebrow">Fiyat bantları</p>
          <h2 id="bands-h" className="center-h">Hangi fiyatta kaç davetiye var?</h2>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Fiyat bantlarına göre davetiye sayısı ve örnekler</caption>
              <thead>
                <tr>
                  <th scope="col">Fiyat</th>
                  <th scope="col">Davetiye</th>
                  <th scope="col">Örnek</th>
                  <th scope="col">İncele</th>
                </tr>
              </thead>
              <tbody>
                {bands.map((price) => {
                  const count = live.filter((t) => t.price === price).length;
                  const slug = PRICE_BAND_SLUGS[price] ?? live.find((t) => t.price === price)?.slug ?? "";
                  const title = live.find((t) => t.slug === slug)?.title ?? slug;
                  return (
                    <tr key={price}>
                      <th scope="row" className="num">{formatTL(price)}</th>
                      <td className="num">{count}</td>
                      <td>{PRICE_BAND_SAMPLES[price] ?? title}</td>
                      <td>
                        <Link href={`/tr/temalar/${slug}`} className="link-arrow" aria-label={`İncele: ${title}`}>
                          İncele <Icon name="arrow" size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="page-cta">
            <h2>Fiyatı davetiye oluşturucuda satır satır görün</h2>
            <p>Seçtiğiniz her eklenti fiyat özetine anında yansır; sürpriz yok.</p>
            <Link href="/tr/davetiye-olustur" className="btn btn--dark btn--lg btn--serif">
              Hemen Başla <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
