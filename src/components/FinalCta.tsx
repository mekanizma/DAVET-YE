import Link from "next/link";
import Icon from "./Icon";
import HomeAmbient from "./home/HomeAmbient";
import { startingPrice, visibleThemes } from "@/lib/catalog";
import { getPublicCatalog } from "@/lib/store";

export default async function FinalCta() {
  const cat = await getPublicCatalog();
  const count = visibleThemes(cat).length;
  const minPrice = startingPrice(cat);
  return (
    <section className="final-cta" aria-labelledby="final-title">
      <div className="final-cta__wash" aria-hidden="true" />
      <HomeAmbient tone="dark" />
      <div className="wrap wrap--sm final-cta__inner">
        <p className="eyebrow eyebrow--accent">Hazırsanız</p>
        <h2 id="final-title">Davetiniz daha başlamadan, ilk izleniminizi bırakın.</h2>
        <p className="final-cta__lead">
          {count} davetiye · {new Intl.NumberFormat("tr-TR").format(minPrice)} TL&apos;den başlayan fiyatlarla · tek seferlik havale
        </p>
        <Link href="/tr/davetiye-olustur" className="btn btn--gold btn--lg">
          Hemen Başla <Icon name="arrow" size={16} />
        </Link>
      </div>
    </section>
  );
}
