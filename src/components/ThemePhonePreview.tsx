"use client";

import { useState } from "react";
import PhoneFrame from "./PhoneFrame";
import { withLocaleQuery } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";

export default function ThemePhonePreview({ slug, title }: { slug: string; title: string }) {
  const [mode, setMode] = useState<"tek" | "kina-dugun">("tek");
  const en = useLocale() === "en";
  return (
    <div className="tpreview">
      <div className="seg seg--pill" role="group" aria-label={en ? "Preview type" : "Önizleme türü"}>
        <button type="button" className="seg__btn" aria-pressed={mode === "tek"} onClick={() => setMode("tek")}>
          {en ? "One event" : "Tek etkinlik"}
        </button>
        <button type="button" className="seg__btn" aria-pressed={mode === "kina-dugun"} onClick={() => setMode("kina-dugun")}>
          {en ? "Henna + wedding" : "Kına + Düğün"}
        </button>
      </div>
      <PhoneFrame className="tpreview__phone">
        <iframe
          key={mode}
          title={en ? `${title} invitation preview` : `${title} davetiye önizlemesi`}
          src={withLocaleQuery(en ? "en" : "tr", `/onizleme/tema/${slug}?embed=1&mod=${mode}`)}
          loading="lazy"
          className="tpreview__frame"
        />
      </PhoneFrame>
      <p className="tpreview__hint">{en ? "Swipe the preview as you would on a phone." : "Önizlemeyi telefondaki gibi kaydırarak deneyin."}</p>
    </div>
  );
}
