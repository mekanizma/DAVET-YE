import Link from "next/link";
import Icon from "../Icon";
import ProductCard from "../ProductCard";
import SectionHead from "../SectionHead";
import { localizeTheme } from "@/i18n/catalog";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import type { Theme } from "@/data/themes";

export default async function FeaturedDesigns({ themes }: { themes: Theme[] }) {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <section className="section section--alt" aria-labelledby="feat-title">
      <div className="wrap">
        <SectionHead
          eyebrow={en ? "Browse invitations" : "Davetiyeleri keşfet"}
          id="feat-title"
          title={en ? "Featured designs" : "Öne çıkan tasarımlar"}
        />
        <div className="card-grid card-grid--phones">
          {themes.map((t, i) => (
            <ProductCard key={t.slug} theme={localizeTheme(t, locale)} priority={i < 3} />
          ))}
        </div>
        <p className="section__more">
          <Link href={lp(locale, "/temalar")} className="btn btn--outline">
            {en ? "See every invitation" : "Tüm davetiyeleri gör"} <Icon name="arrow" size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
