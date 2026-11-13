import Link from "next/link";
import Icon from "../Icon";
import NewspaperCard from "../NewspaperCard";
import NewsFlashBg from "./NewsFlashBg";
import { applyNewspaper } from "@/lib/catalog";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { getPublicCatalog } from "@/lib/store";
import { newspapers } from "@/data/newspapers";

export default async function NewspaperStrip() {
  const [cat, locale] = await Promise.all([getPublicCatalog(), getLocale()]);
  const en = locale === "en";
  const shown = newspapers
    .map((n) => applyNewspaper(n, cat))
    .filter((n) => !cat.newspapers[n.slug]?.hidden)
    .slice(0, 4);
  const steps = en
    ? [
        { icon: "doc" as const, title: "Choose a template", text: "Pick one of the ready-made front pages." },
        { icon: "type" as const, title: "Write your story", text: "Place the words and the photographs." },
        { icon: "print" as const, title: "Share it or print it", text: "Share the link, or print at A3 or A2." },
      ]
    : [
        { icon: "doc" as const, title: "Şablonu seçin", text: "Hazır manşetlerden birini seçin." },
        { icon: "type" as const, title: "Hikâyenizi yazın", text: "Metinleri ve fotoğrafları yerleştirin." },
        { icon: "print" as const, title: "Paylaşın / bastırın", text: "Bağlantıyla paylaşın, A3/A2 alın." },
      ];

  return (
    <section className="section news-strip" aria-labelledby="news-title">
      <NewsFlashBg />
      <div className="wrap news-strip__content">
        <div className="news-strip__head">
          <div className="news-strip__intro">
            <p className="eyebrow">{en ? "Newspapers" : "Gazeteler"}</p>
            <h2 id="news-title" className="news-strip__title">
              {en ? <>Your story, <em>on the front page</em></> : <>Hikâyeniz <em>manşette</em></>}
            </h2>
            <p className="news-strip__lead">
              {en
                ? "A page-turning digital newspaper and a print-ready file. Keep the story of your celebration in one template."
                : "Sayfa çevirmeli dijital gazete ve baskıya hazır dosya — davetinizin hikâyesini tek şablonda toplayın."}
            </p>
          </div>

          <ol className="news-strip__steps">
            {steps.map((s, i) => (
              <li key={s.title} className="news-strip__step">
                <span className="news-strip__step-no" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="news-strip__step-icon">
                  <Icon name={s.icon} size={16} />
                </span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="news-strip__rail" aria-hidden="true" />

        <div className="card-grid card-grid--news news-strip__grid">
          {shown.map((n, i) => (
            <NewspaperCard key={n.slug} paper={n} priority={i < 2} />
          ))}
        </div>

        <p className="section__more news-strip__more">
          <Link href={lp(locale, "/gazeteler")} className="btn btn--outline">
            {en ? "See every newspaper" : "Tüm gazeteleri gör"} <Icon name="arrow" size={14} />
          </Link>
          <Link href={lp(locale, "/gazete-tasarla")} className="btn btn--dark">
            {en ? "Create a newspaper" : "Gazete Oluştur"} <Icon name="arrow" size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
