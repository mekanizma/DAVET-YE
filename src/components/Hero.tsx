"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import HomeAmbient from "./home/HomeAmbient";
import PhoneCarousel, { usePrefersReducedMotion } from "./PhoneCarousel";
import { newspapers } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { marketing } from "@/i18n/marketing";
import { useLocale, useLp } from "@/i18n/provider";
import type { Theme } from "@/data/themes";

export default function Hero({ featured }: { featured: Theme[] }) {
  const locale = useLocale();
  const lp = useLp();
  const en = locale === "en";
  const copy = marketing(locale);
  const words = copy.heroWords;
  const [w, setW] = useState(0);
  const reduced = usePrefersReducedMotion();
  const bulletin = newspapers.find((paper) => paper.slug === "ask-bulteni");
  const paper = bulletin ? localizeNewspaper(bulletin, locale) : null;

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setW((x) => (x + 1) % words.length), 2800);
    return () => clearInterval(t);
  }, [reduced, words.length]);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <HomeAmbient className="hero__atmosphere" tone="light" />

      <div className="wrap wrap--lg hero__grid">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            <span className="eyebrow eyebrow--line">{en ? "Digital invitations & newspapers" : "Dijital davetiye & gazete"}</span>
            <span className="hero__line">{en ? "Your celebration" : "Özel gününüz,"}</span>
            <span className="hero__line hero__line--accent">
              {en ? "deserves a special " : "özel bir "}
              <span className="hero__word-wrap">
                <span key={w} className="hero__word">
                  {words[w]}
                </span>
              </span>
            </span>
            <span className="hero__line">{en ? "of its own." : "hak eder."}</span>
          </h1>
          <p className="hero__lead">
            {en
              ? "Make an elegant digital invitation that opens on a phone, and a newspaper that puts your story on the front page, in a few minutes. Share one link, and follow every reply from a single account."
              : "Telefonda açılan zarif dijital davetiyenizi ve hikâyenizi manşete taşıyan gazetenizi dakikalar içinde hazırlayın; tek bağlantıyla paylaşın, yanıtları tek panelden izleyin."}
          </p>

          <ul className="hero__cards">
            <li className="hcard hcard--primary">
              <span className="hcard__index" aria-hidden="true">01</span>
              <span className="hcard__icon"><Icon name="mail" size={20} /></span>
              <div>
                <h2 className="hcard__title">
                  <Link href={lp("/davetiye-olustur")}>{en ? "Digital invitation" : "Dijital Davetiye"}</Link>
                </h2>
                <p>
                  {en
                    ? "An animated opening, an RSVP form, a map, and a countdown. It opens on a phone from a single link."
                    : "Animasyonlu açılış, katılım formu, konum ve geri sayım; tek bağlantıyla telefonda açılır."}
                </p>
                <span className="hcard__cta">{en ? "Create an invitation" : "Davetiye Oluştur"} <Icon name="arrow" size={14} /></span>
                <Link href={lp("/temalar")} className="hcard__sub">{en ? "Browse invitations" : "Davetiyeleri Keşfet"}</Link>
              </div>
            </li>
            <li className="hcard">
              <span className="hcard__index" aria-hidden="true">02</span>
              <span className="hcard__icon"><Icon name="doc" size={20} /></span>
              <div>
                <h2 className="hcard__title">
                  <Link href={lp("/gazete-tasarla")}>{en ? "Newspapers" : "Gazeteler"}</Link>
                </h2>
                <p>
                  {en
                    ? "Your story on the front page: a page-turning digital newspaper, and a file ready to print at A3 or A2."
                    : "Hikâyeniz manşette: sayfa çevirmeli dijital gazete ve A3/A2 baskıya hazır dosya."}
                </p>
                <span className="hcard__cta">{en ? "Create a newspaper" : "Gazete Oluştur"} <Icon name="arrow" size={14} /></span>
                <Link href={lp("/gazeteler")} className="hcard__sub">{en ? "Browse newspapers" : "Gazeteleri keşfet"}</Link>
              </div>
            </li>
          </ul>

          <ul className="hero__trust" aria-label={en ? "Highlights" : "Hizmet avantajları"}>
            {copy.heroTrust.map((t) => (
              <li key={t}>
                <span className="tick"><Icon name="check" size={12} /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__visual">
          <div className="hero__stage-glow" aria-hidden="true" />
          <PhoneCarousel items={featured.slice(0, 6)} />
          {paper && (
            <Link href={lp("/gazeteler/ask-bulteni")} className="hero__paper" aria-label={en ? `View the ${paper.title} newspaper` : `${paper.title} gazetesini incele`}>
              <Image
                src="/img/times/ask-bulteni-kapak.jpg"
                alt={paper.title}
                width={320}
                height={452}
                sizes="(max-width: 600px) 36vw, 190px"
              />
              <span className="hero__paper-pill">
                <Icon name="doc" size={14} /> {en ? "Newspapers" : "Gazeteler"}
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
