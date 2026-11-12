import Link from "next/link";
import Icon from "../Icon";
import SectionHead from "../SectionHead";
import { CATEGORIES } from "@/data/site";

const MINI: Record<string, { text: string; tone: string }> = {
  "Nişan & Düğün": { text: "A & M", tone: "ivory" },
  "Çoklu Etkinlik": { text: "İki Gün", tone: "ivory" },
  Kına: { text: "Kına", tone: "wine" },
};

export default function CategoryDiscovery() {
  return (
    <section className="section section--tight" aria-labelledby="cat-title">
      <div className="wrap">
        <SectionHead
          id="cat-title"
          title="Kategorilere göre keşfedin"
          lead="Her kutlamanın ruhuna uygun, özenle hazırlanmış tasarımlar."
          heart
        />
        <ul className="cat-grid">
          {CATEGORIES.map((c, i) => {
            const mini = MINI[c.label];
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
