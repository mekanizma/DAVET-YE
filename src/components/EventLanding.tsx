import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import SectionHead from "./SectionHead";
import ThemeCatalog from "./ThemeCatalog";
import { themes, type EventType } from "@/data/themes";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { marketing } from "@/i18n/marketing";
import { getPublicCatalog } from "@/lib/store";

export default async function EventLanding({
  event,
  eyebrow,
  title,
  lead,
  points,
}: {
  event: EventType;
  eyebrow: string;
  title: string;
  lead: string;
  points: { title: string; text: string }[];
}) {
  const [cat, locale] = await Promise.all([getPublicCatalog(), getLocale()]);
  const en = locale === "en";
  const label = marketing(locale).events[event];
  const count = themes.filter((t) => t.eventTypes.includes(event) && !cat.themes[t.slug]?.hidden).length;
  const countLabel = en
    ? `${count} ${count === 1 ? "invitation" : "invitations"}`
    : `${count} davetiye`;
  return (
    <>
      <section className="page-hero">
        <Image src="/img/decor/bouquet-tr.webp" alt="" width={420} height={520} className="page-hero__decor" aria-hidden="true" />
        <div className="wrap wrap--lg page-hero__inner">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-hero__title page-hero__title--wide">{title}</h1>
          <p className="page-hero__lead">{lead}</p>
          <p className="page-hero__meta">
            <span className="chip">{label}</span>
            <span className="chip">{countLabel}</span>
          </p>
          <div className="hero-actions">
            <Link href={lp(locale, "/davetiye-olustur/etkinlik")} className="btn btn--dark btn--serif">
              {en ? "Create an invitation" : "Davetiye Oluştur"} <Icon name="arrow" size={16} />
            </Link>
            <Link href={lp(locale, "/temalar")} className="btn btn--outline">{en ? "All invitations" : "Tüm davetiyeler"}</Link>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <ul className="why-grid why-grid--three">
            {points.map((p) => (
              <li key={p.title} className="why-card">
                <span className="why-card__icon"><Icon name="check" size={18} /></span>
                <div>
                  <h2 className="why-card__h">{p.title}</h2>
                  <p>{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="landing-cat">
        <div className="wrap wrap--lg">
          <SectionHead
            id="landing-cat"
            title={en ? `${label} invitations` : `${label} davetiyeleri`}
            lead={en ? "Preview any invitation full screen before you buy." : "Satın almadan önce her davetiyeyi tam ekran önizleyebilirsiniz."}
          />
          <ThemeCatalog
            fixedEvent={event}
            initial={{ q: "", etkinlik: event, etiket: "", sirala: "onerilen" }}
          />
        </div>
      </section>
    </>
  );
}
