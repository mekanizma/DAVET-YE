import Link from "next/link";
import Icon from "./Icon";
import HomeAmbient from "./home/HomeAmbient";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { startingPrice, visibleThemes } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { getPublicCatalog } from "@/lib/store";

export default async function FinalCta() {
  const [cat, locale] = await Promise.all([getPublicCatalog(), getLocale()]);
  const en = locale === "en";
  const count = visibleThemes(cat).length;
  const minPrice = startingPrice(cat);
  const price = formatTL(minPrice, locale);
  return (
    <section className="final-cta" aria-labelledby="final-title">
      <div className="final-cta__wash" aria-hidden="true" />
      <HomeAmbient tone="dark" />
      <div className="wrap wrap--sm final-cta__inner">
        <p className="eyebrow eyebrow--accent">{en ? "When you are ready" : "Hazırsanız"}</p>
        <h2 id="final-title">
          {en
            ? "Make a first impression before the celebration begins."
            : "Davetiniz daha başlamadan, ilk izleniminizi bırakın."}
        </h2>
        <p className="final-cta__lead">
          {en
            ? `${count} invitations · prices from ${price} · a one-time card payment`
            : `${count} davetiye · ${price}'den başlayan fiyatlarla · tek seferlik kart ödemesi`}
        </p>
        <Link href={lp(locale, "/davetiye-olustur")} className="btn btn--gold btn--lg">
          {en ? "Start now" : "Hemen Başla"} <Icon name="arrow" size={16} />
        </Link>
      </div>
    </section>
  );
}
