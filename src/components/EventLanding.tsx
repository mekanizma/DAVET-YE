import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import SectionHead from "./SectionHead";
import ThemeCatalog from "./ThemeCatalog";
import { EVENT_LABELS, themes, type EventType } from "@/data/themes";
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
  const cat = await getPublicCatalog();
  const count = themes.filter((t) => t.eventTypes.includes(event) && !cat.themes[t.slug]?.hidden).length;
  return (
    <>
      <section className="page-hero">
        <Image src="/img/decor/bouquet-tr.webp" alt="" width={420} height={520} className="page-hero__decor" aria-hidden="true" />
        <div className="wrap wrap--lg page-hero__inner">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-hero__title page-hero__title--wide">{title}</h1>
          <p className="page-hero__lead">{lead}</p>
          <p className="page-hero__meta">
            <span className="chip">{EVENT_LABELS[event]}</span>
            <span className="chip">{count} davetiye</span>
          </p>
          <div className="hero-actions">
            <Link href={`/tr/davetiye-olustur/etkinlik`} className="btn btn--dark btn--serif">
              Davetiye Oluştur <Icon name="arrow" size={16} />
            </Link>
            <Link href="/tr/temalar" className="btn btn--outline">Tüm davetiyeler</Link>
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
          <SectionHead id="landing-cat" title={`${EVENT_LABELS[event]} davetiyeleri`} lead="Satın almadan önce her davetiyeyi tam ekran önizleyebilirsiniz." />
          <ThemeCatalog
            fixedEvent={event}
            initial={{ q: "", etkinlik: event, etiket: "", sirala: "onerilen" }}
          />
        </div>
      </section>
    </>
  );
}
