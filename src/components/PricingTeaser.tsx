import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import SectionHead from "./SectionHead";
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
  const cat = await getPublicCatalog();
  const minPrice = startingPrice(cat);
  const addons = cat.addons.filter((a) => a.active && a.id !== "ek-sure");
  return (
    <section className="section section--alt" aria-labelledby="price-title">
      <div className="wrap">
        <SectionHead
          eyebrow="Şeffaf fiyat"
          id="price-title"
          title="Tek seferlik ödeme, abonelik yok"
          lead="Temel bölümler davetiyenin fiyatına dahildir. Anı Duvarı, Anı Çekimi (Lens) ve Masa QR Kartı gibi eklentileri yalnızca isterseniz alırsınız."
          heart
        />
        <div className="price-grid">
          <div className="price-card">
            <p className="price-card__eyebrow">Başlangıç fiyatı</p>
            <p className="price-card__amount">
              {new Intl.NumberFormat("tr-TR").format(minPrice)} <span>TL</span>
            </p>
            <p className="price-card__text">
              Seçtiğiniz davetiyenin fiyatı; davetiyedeki bütün bölümler dahil.
            </p>
            <ul className="price-card__list">
              {["Tek seferlik ödeme", "Sınırsız katılım yanıtı", "Sınırsız misafir görüntüleme"].map((x) => (
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

          <div className="addons">
            <h3 className="addons__title">Eklentiler</h3>
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
                  <strong className="addon__price">{a.price === 0 ? "Ücretsiz" : formatTL(a.price)}</strong>
                </li>
              ))}
            </ul>
            <Link href="/tr/fiyatlar" className="link-arrow">
              Tüm fiyatları görün <Icon name="arrow" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
