"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import PhoneFrame from "./PhoneFrame";
import Icon from "./Icon";
import { localizeTheme } from "@/i18n/catalog";
import { useLocale, useLp } from "@/i18n/provider";
import { coverOf, type Theme } from "@/data/themes";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export { usePrefersReducedMotion };

export default function PhoneCarousel({
  items,
  interval = 3800,
  onIndexChange,
}: {
  items: Theme[];
  interval?: number;
  onIndexChange?: (i: number) => void;
}) {
  const locale = useLocale();
  const lp = useLp();
  const en = locale === "en";
  const n = items.length;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const reduced = usePrefersReducedMotion();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const view = (theme: Theme) => localizeTheme(theme, locale);
  const slideLabel = (i: number) => (en ? `Preview ${i + 1} of ${n}` : `Önizleme ${i + 1} / ${n}`);

  const go = useCallback(
    (i: number) => {
      const next = ((i % n) + n) % n;
      setIdx(next);
      onIndexChange?.(next);
    },
    [n, onIndexChange],
  );

  useEffect(() => {
    if (reduced || paused || hover) return;
    const t = setInterval(() => go(idx + 1), interval);
    return () => clearInterval(t);
  }, [idx, reduced, paused, hover, interval, go]);

  const pos = (i: number) => {
    const rel = (i - idx + n) % n;
    if (rel === 0) return "center";
    if (rel === 1) return "right";
    if (rel === n - 1) return "left";
    return "hidden";
  };

  return (
    <div
      className="pcarousel"
      role="group"
      aria-roledescription="carousel"
      aria-label={en ? "Digital invitation previews" : "Dijital davetiye önizlemeleri"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(idx + 1);
        if (e.key === "ArrowLeft") go(idx - 1);
      }}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="pcarousel__stage">
        {items.map((t, i) => {
          const shown = view(t);
          const p = pos(i);
          const active = p === "center";
          return (
            <div
              key={t.slug}
              className="pcarousel__item"
              data-pos={p}
              role="group"
              aria-roledescription="slide"
              aria-label={slideLabel(i)}
              aria-hidden={p === "hidden" ? true : undefined}
            >
              <PhoneFrame>
                <Image
                  src={coverOf(t)}
                  alt={shown.title}
                  width={360}
                  height={640}
                  sizes="(max-width: 600px) 56vw, 300px"
                  priority={i < 3}
                />
              </PhoneFrame>
              {active ? (
                <Link href={lp(`/temalar/${t.slug}`)} className="pcarousel__cta">
                  {en ? "View" : "İncele"} <span className="sr-only">{shown.title}</span>
                </Link>
              ) : (
                p !== "hidden" && (
                  <button
                    type="button"
                    className="pcarousel__side"
                    onClick={() => go(i)}
                    aria-label={en ? `Go to the ${shown.title} preview` : `${shown.title} önizlemesine geç`}
                  />
                )
              )}
            </div>
          );
        })}
      </div>

      <div className="pcarousel__dots">
        {items.map((t, i) => (
          <button
            key={t.slug}
            type="button"
            className={`pcarousel__dot${i === idx ? " is-active" : ""}`}
            aria-label={slideLabel(i)}
            aria-current={i === idx ? "true" : undefined}
            onClick={() => go(i)}
          />
        ))}
        {!reduced && (
          <button
            type="button"
            className="pcarousel__pause"
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
            aria-label={paused
              ? (en ? "Start automatic playback" : "Otomatik geçişi başlat")
              : (en ? "Pause automatic playback" : "Otomatik geçişi durdur")}
          >
            <Icon name={paused ? "chevron-right" : "minus"} size={12} />
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {en
          ? `${view(items[idx]).title}, preview ${idx + 1} of ${n}`
          : `${view(items[idx]).title}, önizleme ${idx + 1} / ${n}`}
      </p>
    </div>
  );
}
