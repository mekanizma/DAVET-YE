"use client";

import { useState } from "react";
import DesignCard from "./DesignCard";
import { designPresets, stateFromPreset } from "@/data/designs";
import { studioName } from "@/i18n/catalog";
import { useLocale } from "@/i18n/provider";

const FEATURED = (designPresets.filter((p) => p.featured).length >= 6
  ? designPresets.filter((p) => p.featured)
  : designPresets
).slice(0, 6);

/** Three-card fan; manual selection only (no autoplay, so nothing moves without the user asking). */
export default function StudioHero() {
  const [i, setI] = useState(0);
  const locale = useLocale();
  const en = locale === "en";
  const n = FEATURED.length;
  const at = (o: number) => FEATURED[(i + o + n) % n];
  const currentName = studioName(FEATURED[i].id, FEATURED[i].name, locale);
  return (
    <div className="studio-fan" role="group" aria-roledescription="carousel" aria-label={en ? "Featured ready-made designs" : "Öne çıkan hazır tasarımlar"}>
      <div className="studio-fan__stage" aria-live="polite">
        {([-1, 1, 0] as const).map((o) => (
          <div key={at(o).id} className={`studio-fan__card studio-fan__card--${o === 0 ? "c" : o < 0 ? "l" : "r"}`} aria-hidden={o !== 0}>
            <DesignCard design={stateFromPreset(at(o))} />
          </div>
        ))}
      </div>
      <p className="sr-only">{currentName} · {en ? "Preview" : "Önizleme"} {i + 1} / {n}</p>
      <div className="studio-fan__dots">
        {FEATURED.map((p, k) => (
          <button key={p.id} type="button" aria-pressed={k === i} aria-label={studioName(p.id, p.name, locale)} onClick={() => setI(k)} className="studio-fan__dot" />
        ))}
      </div>
    </div>
  );
}
