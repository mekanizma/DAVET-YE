import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import SectionHead from "./SectionHead";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { marketing } from "@/i18n/marketing";

const ICONS: IconName[] = ["image", "type", "share"];

export default async function HowItWorks() {
  const locale = await getLocale();
  const en = locale === "en";
  const copy = marketing(locale);
  return (
    <section className="section" aria-labelledby="how-title">
      <div className="wrap">
        <SectionHead
          eyebrow={en ? "How it works" : "Nasıl çalışır"}
          id="how-title"
          title={en ? "How your invitation is made" : "Davetiyeniz nasıl hazırlanır?"}
          heart
        />
        <ol className="how-steps">
          {copy.howHome.map((s, i) => (
            <li key={s.title} className="how-step">
              <span className="how-step__icon">
                <Icon name={ICONS[i]} size={26} />
              </span>
              <h3>
                <span className="how-step__no">{i + 1}.</span> {s.title}
              </h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="section__more">
          <Link href={lp(locale, "/nasil-calisir")} className="link-arrow">
            {en ? "See all six steps" : "Altı adımın tamamını görün"} <Icon name="arrow" size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
