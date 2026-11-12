"use client";

import { useState } from "react";
import PhoneFrame from "./PhoneFrame";

export default function ThemePhonePreview({ slug, title }: { slug: string; title: string }) {
  const [mode, setMode] = useState<"tek" | "kina-dugun">("tek");
  return (
    <div className="tpreview">
      <div className="seg seg--pill" role="group" aria-label="Önizleme türü">
        <button type="button" className="seg__btn" aria-pressed={mode === "tek"} onClick={() => setMode("tek")}>
          Tek etkinlik
        </button>
        <button type="button" className="seg__btn" aria-pressed={mode === "kina-dugun"} onClick={() => setMode("kina-dugun")}>
          Kına + Düğün
        </button>
      </div>
      <PhoneFrame className="tpreview__phone">
        <iframe
          key={mode}
          title={`${title} davetiye önizlemesi`}
          src={`/onizleme/tema/${slug}?embed=1&mod=${mode}`}
          loading="lazy"
          className="tpreview__frame"
        />
      </PhoneFrame>
      <p className="tpreview__hint">Önizlemeyi telefondaki gibi kaydırarak deneyin.</p>
    </div>
  );
}
