import Icon, { type IconName } from "./Icon";
import SectionHead, { Ornament } from "./SectionHead";
import { WHY_DIGITAL } from "@/data/site";

export default function WhyDigital() {
  return (
    <section className="section" aria-labelledby="why-title">
      <div className="wrap">
        <div className="section__orn"><Ornament /></div>
        <SectionHead id="why-title" title="Neden dijital davetiye?" heart />
        <div className="why-grid">
          {WHY_DIGITAL.map((w) => (
            <article key={w.title} className="why-card">
              <span className="why-card__icon">
                <Icon name={w.icon as IconName} size={20} />
              </span>
              <div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
