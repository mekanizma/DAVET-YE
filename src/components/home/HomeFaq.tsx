import Link from "next/link";
import Accordion from "../Accordion";
import Icon from "../Icon";
import SectionHead from "../SectionHead";
import { FAQ } from "@/data/faq";

export default function HomeFaq() {
  return (
    <section className="section" aria-labelledby="faq-title">
      <div className="wrap wrap--sm">
        <SectionHead eyebrow="Sıkça sorulan sorular" id="faq-title" title="Aklınızdaki her şey burada." />
        <Accordion items={FAQ} />
        <p className="section__more">
          <Link href="/tr/sss" className="link-arrow">
            Tüm soruları görün <Icon name="arrow" size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
