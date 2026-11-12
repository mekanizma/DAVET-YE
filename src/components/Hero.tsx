"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import HomeAmbient from "./home/HomeAmbient";
import PhoneCarousel, { usePrefersReducedMotion } from "./PhoneCarousel";
import { HERO_TRUST, HERO_WORDS } from "@/data/site";
import type { Theme } from "@/data/themes";

export default function Hero({ featured }: { featured: Theme[] }) {
  const [w, setW] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setW((x) => (x + 1) % HERO_WORDS.length), 2800);
    return () => clearInterval(t);
  }, [reduced]);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <HomeAmbient className="hero__atmosphere" tone="light" />

      <div className="wrap wrap--lg hero__grid">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            <span className="eyebrow eyebrow--line">Dijital davetiye &amp; gazete</span>
            <span className="hero__line">Özel gününüz,</span>
            <span className="hero__line hero__line--accent">
              özel bir{" "}
              <span className="hero__word-wrap">
                <span key={w} className="hero__word">
                  {HERO_WORDS[w]}
                </span>
              </span>
            </span>
            <span className="hero__line">hak eder.</span>
          </h1>
          <p className="hero__lead">
            Telefonda açılan zarif dijital davetiyenizi ve hikâyenizi manşete taşıyan gazetenizi
            dakikalar içinde hazırlayın; tek bağlantıyla paylaşın, yanıtları tek panelden izleyin.
          </p>

          <ul className="hero__cards">
            <li className="hcard hcard--primary">
              <span className="hcard__index" aria-hidden="true">01</span>
              <span className="hcard__icon"><Icon name="mail" size={20} /></span>
              <div>
                <h2 className="hcard__title">
                  <Link href="/tr/davetiye-olustur">Dijital Davetiye</Link>
                </h2>
                <p>Animasyonlu açılış, katılım formu, konum ve geri sayım; tek bağlantıyla telefonda açılır.</p>
                <span className="hcard__cta">Davetiye Oluştur <Icon name="arrow" size={14} /></span>
                <Link href="/tr/temalar" className="hcard__sub">Davetiyeleri Keşfet</Link>
              </div>
            </li>
            <li className="hcard">
              <span className="hcard__index" aria-hidden="true">02</span>
              <span className="hcard__icon"><Icon name="doc" size={20} /></span>
              <div>
                <h2 className="hcard__title">
                  <Link href="/tr/gazete-tasarla">Gazeteler</Link>
                </h2>
                <p>Hikâyeniz manşette: sayfa çevirmeli dijital gazete ve A3/A2 baskıya hazır dosya.</p>
                <span className="hcard__cta">Gazete Oluştur <Icon name="arrow" size={14} /></span>
                <Link href="/tr/gazeteler" className="hcard__sub">Gazeteleri keşfet</Link>
              </div>
            </li>
          </ul>

          <ul className="hero__trust" aria-label="Hizmet avantajları">
            {HERO_TRUST.map((t) => (
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
          <Link href="/tr/gazeteler/ask-bulteni" className="hero__paper" aria-label="Aşk Bülteni gazetesini incele">
            <Image
              src="/img/times/ask-bulteni-kapak.jpg"
              alt="Aşk Bülteni"
              width={320}
              height={452}
              sizes="(max-width: 600px) 36vw, 190px"
            />
            <span className="hero__paper-pill">
              <Icon name="doc" size={14} /> Gazeteler
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
