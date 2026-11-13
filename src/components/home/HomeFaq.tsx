import Link from "next/link";
import Accordion from "../Accordion";
import Icon from "../Icon";
import SectionHead from "../SectionHead";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { marketing } from "@/i18n/marketing";

export default async function HomeFaq() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <section className="section" aria-labelledby="faq-title">
      <div className="wrap wrap--sm">
        <SectionHead
          eyebrow={en ? "Frequently asked questions" : "Sıkça sorulan sorular"}
          id="faq-title"
          title={en ? "The answers are all here." : "Aklınızdaki her şey burada."}
        />
        <Accordion items={marketing(locale).faq} />
        <p className="section__more">
          <Link href={lp(locale, "/sss")} className="link-arrow">
            {en ? "See every question" : "Tüm soruları görün"} <Icon name="arrow" size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
