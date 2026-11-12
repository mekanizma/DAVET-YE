"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import PhoneFrame from "./PhoneFrame";
import Icon from "./Icon";
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
  const n = items.length;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const reduced = usePrefersReducedMotion();
  const touch = useRef<{ x: number; y: number } | null>(null);

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
      aria-label="Dijital davetiye önizlemeleri"
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
          const p = pos(i);
          const active = p === "center";
          return (
            <div
              key={t.slug}
              className="pcarousel__item"
              data-pos={p}
              role="group"
              aria-roledescription="slide"
              aria-label={`Önizleme ${i + 1} / ${n}`}
              aria-hidden={p === "hidden" ? true : undefined}
            >
              <PhoneFrame>
                <Image
                  src={coverOf(t)}
                  alt={t.title}
                  width={360}
                  height={640}
                  sizes="(max-width: 600px) 56vw, 300px"
                  priority={i < 3}
                />
              </PhoneFrame>
              {active ? (
                <Link href={`/tr/temalar/${t.slug}`} className="pcarousel__cta">
                  İncele <span className="sr-only">{t.title}</span>
                </Link>
              ) : (
                p !== "hidden" && (
                  <button
                    type="button"
                    className="pcarousel__side"
                    onClick={() => go(i)}
                    aria-label={`${t.title} önizlemesine geç`}
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
            aria-label={`Önizleme ${i + 1} / ${n}`}
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
            aria-label={paused ? "Otomatik geçişi başlat" : "Otomatik geçişi durdur"}
          >
            <Icon name={paused ? "chevron-right" : "minus"} size={12} />
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {items[idx].title}, önizleme {idx + 1} / {n}
      </p>
    </div>
  );
}
