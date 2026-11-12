import Link from "next/link";
import Icon from "../Icon";
import ProductCard from "../ProductCard";
import SectionHead from "../SectionHead";
import type { Theme } from "@/data/themes";

export default function FeaturedDesigns({ themes }: { themes: Theme[] }) {
  return (
    <section className="section section--alt" aria-labelledby="feat-title">
      <div className="wrap">
        <SectionHead eyebrow="Davetiyeleri keşfet" id="feat-title" title="Öne çıkan tasarımlar" />
        <div className="card-grid card-grid--phones">
          {themes.map((t, i) => (
            <ProductCard key={t.slug} theme={t} priority={i < 3} />
          ))}
        </div>
        <p className="section__more">
          <Link href="/tr/temalar" className="btn btn--outline">
            Tüm davetiyeleri gör <Icon name="arrow" size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
