import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import SectionHead from "./SectionHead";
import { HOW_IT_WORKS_HOME } from "@/data/site";

const ICONS: IconName[] = ["image", "type", "share"];

export default function HowItWorks() {
  return (
    <section className="section" aria-labelledby="how-title">
      <div className="wrap">
        <SectionHead eyebrow="Nasıl çalışır" id="how-title" title="Davetiyeniz nasıl hazırlanır?" heart />
        <ol className="how-steps">
          {HOW_IT_WORKS_HOME.map((s, i) => (
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
          <Link href="/tr/nasil-calisir" className="link-arrow">
            Altı adımın tamamını görün <Icon name="arrow" size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
