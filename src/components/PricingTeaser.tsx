import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import SectionHead from "./SectionHead";
import { localizeAddons } from "@/i18n/product";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { marketing } from "@/i18n/marketing";
import { startingPrice } from "@/lib/catalog";
import { getPublicCatalog } from "@/lib/store";
import { formatTL } from "@/lib/format";

const ADDON_ICONS: Record<string, IconName> = {
  "ani-duvari": "image",
  "ani-cekimi": "camera",
  "masa-qr": "camera",
  "ek-dil": "globe",
  markasiz: "sparkle",
  "ek-depolama": "wallet",
};

export default async function PricingTeaser() {
  const [cat, locale] = await Promise.all([getPublicCatalog(), getLocale()]);
  const en = locale === "en";
  const copy = marketing(locale);
  const minPrice = startingPrice(cat);
  const addons = localizeAddons(cat.addons.filter((a) => a.active && a.id !== "ek-sure"), locale);
  const amount = formatTL(minPrice, locale).replace(/\sTL$/, "");
  const included = en
    ? ["One-time payment", "Unlimited RSVPs", "Unlimited guest views"]
    : ["Tek seferlik ödeme", "Sınırsız katılım yanıtı", "Sınırsız misafir görüntüleme"];
  return (
    <section className="section section--alt" aria-labelledby="price-title">
      <div className="wrap">
        <SectionHead
          eyebrow={en ? "Clear pricing" : "Şeffaf fiyat"}
          id="price-title"
          title={en ? "A one-time payment, with no subscription" : "Tek seferlik ödeme, abonelik yok"}
          lead={en
            ? "The main sections are included in the invitation price. Add a Memory Wall, Memory Capture (Lens), or a table QR card only if you want them."
            : "Temel bölümler davetiyenin fiyatına dahildir. Anı Duvarı, Anı Çekimi (Lens) ve Masa QR Kartı gibi eklentileri yalnızca isterseniz alırsınız."}
          heart
        />
        <div className="price-grid">
          <div className="price-card">
            <p className="price-card__eyebrow">{en ? "Starting price" : "Başlangıç fiyatı"}</p>
            <p className="price-card__amount">
              {amount} <span>TL</span>
            </p>
            <p className="price-card__text">
              {en
                ? "The price of the invitation you choose, with every section included."
                : "Seçtiğiniz davetiyenin fiyatı; davetiyedeki bütün bölümler dahil."}
            </p>
            <ul className="price-card__list">
              {included.map((x) => (
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

          <div className="addons">
            <h3 className="addons__title">{en ? "Add-ons" : "Eklentiler"}</h3>
            <ul>
              {addons.map((a) => (
                <li key={a.id} className="addon">
                  <span className="addon__icon">
                    <Icon name={ADDON_ICONS[a.id] ?? "plus"} size={16} />
                  </span>
                  <div className="addon__text">
                    <h4>{a.title}</h4>
                    <p>{a.text}</p>
                  </div>
                  <strong className="addon__price">{a.price === 0 ? copy.free : formatTL(a.price, locale)}</strong>
                </li>
              ))}
            </ul>
            <Link href={lp(locale, "/fiyatlar")} className="link-arrow">
              {en ? "See every price" : "Tüm fiyatları görün"} <Icon name="arrow" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
