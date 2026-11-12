"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { coverOf, type Theme } from "@/data/themes";
import { usePrefersReducedMotion } from "../PhoneCarousel";

export default function FeaturesDemo({ themes }: { themes: Theme[] }) {
  const items = themes.slice(0, 5);
  const [idx, setIdx] = useState(0);
  const reduced = usePrefersReducedMotion();
  const current = items[idx] ?? items[0];

  useEffect(() => {
    if (reduced || items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 3200);
    return () => clearInterval(t);
  }, [reduced, items.length]);

  if (!current) return null;

  return (
    <div className="features__demo">
      <div className="features__arch" aria-hidden="true" />
      <div className="demo-phone">
        <span className="phone__island" aria-hidden="true" />
        <div className="demo-phone__screen">
          {items.map((t, i) => (
            <div
              key={t.slug}
              className={`demo-phone__slide${i === idx ? " is-active" : ""}`}
              aria-hidden={i !== idx}
            >
              <Image
                src={coverOf(t)}
                alt=""
                width={360}
                height={640}
                sizes="150px"
                className="demo-phone__img"
                priority={i === 0}
              />
            </div>
          ))}
          <Link
            href={`/tr/temalar/${current.slug}`}
            className="demo-phone__cta"
            aria-label={`${current.title} davetiyesini incele`}
          >
            {current.title}
          </Link>
        </div>
      </div>
    </div>
  );
}
