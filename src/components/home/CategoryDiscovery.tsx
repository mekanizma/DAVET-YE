import Link from "next/link";
import Icon from "../Icon";
import SectionHead from "../SectionHead";
import { getLocale } from "@/i18n/server";
import { marketing } from "@/i18n/marketing";

export default async function CategoryDiscovery() {
  const locale = await getLocale();
  const en = locale === "en";
  const categories = marketing(locale).categories;
  const miniFor = (slug: string) => {
    if (slug === "barok-kapi") return { text: "A & M", tone: "ivory" };
    if (slug === "guz-masali") return { text: en ? "Two days" : "İki Gün", tone: "ivory" };
    if (slug === "tavuslu-cini") return { text: en ? "Henna" : "Kına", tone: "wine" };
    return null;
  };
  return (
    <section className="section section--tight" aria-labelledby="cat-title">
      <div className="wrap">
        <SectionHead
          id="cat-title"
          title={en ? "Discover by category" : "Kategorilere göre keşfedin"}
          lead={en ? "Designs made with care for the feeling of each celebration." : "Her kutlamanın ruhuna uygun, özenle hazırlanmış tasarımlar."}
          heart
        />
        <ul className="cat-grid">
          {categories.map((c, i) => {
            const mini = miniFor(c.slug);
            return (
              <li key={c.href}>
                <Link href={c.href} className={`cat-card cat-card--${i}`} title={c.text}>
                  <span className="cat-card__label">{c.label}</span>
                  <Icon name="chevron-right" size={14} className="cat-card__arrow" />
                  {mini ? (
                    <span className={`mini-phone mini-phone--${mini.tone}`} aria-hidden="true">
                      <i />
                      <b>{mini.text}</b>
                    </span>
                  ) : (
                    <span className="mini-paper" aria-hidden="true">
                      <i /><i /><i />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
