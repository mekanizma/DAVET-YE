import Icon, { type IconName } from "./Icon";
import SectionHead, { Ornament } from "./SectionHead";
import { getLocale } from "@/i18n/server";
import { marketing } from "@/i18n/marketing";

export default async function WhyDigital() {
  const locale = await getLocale();
  const copy = marketing(locale);
  return (
    <section className="section" aria-labelledby="why-title">
      <div className="wrap">
        <div className="section__orn"><Ornament /></div>
        <SectionHead id="why-title" title={locale === "en" ? "Why a digital invitation?" : "Neden dijital davetiye?"} heart />
        <div className="why-grid">
          {copy.why.map((w) => (
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
