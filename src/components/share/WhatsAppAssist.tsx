"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/locale";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

const AUDIENCES = ["family", "friends", "abroad"] as const;
type Audience = (typeof AUDIENCES)[number];

function templates(locale: Locale, url: string, names: string) {
  const who = names.trim() || (locale === "en" ? "us" : "bizim");
  if (locale === "en") {
    return {
      family: `Dear family,\n\nYou are warmly invited to celebrate with ${who}.\nOur invitation is here:\n${url}\n\nWe would love to see you there.`,
      friends: `Hey!\n\nYou're invited — open our digital invitation:\n${url}\n\nHope you can make it 💛`,
      abroad: `Hello from afar,\n\nOur invitation is online (you can read it in English too):\n${url}\n\nWe hope you can join us, even if only in spirit.`,
    } as const;
  }
  return {
    family: `Sevgili ailemiz,\n\n${who} olarak mutlu günümüze davetlisiniz.\nDavetiyemiz burada:\n${url}\n\nSizi aramızda görmekten mutluluk duyarız.`,
    friends: `Merhaba!\n\nSizi de aramızda görmek isteriz.\nDavetiyemiz:\n${url}\n\nUmarız gelebilirsiniz 💛`,
    abroad: `Merhaba,\n\nDavetiyemiz online (İngilizce de okunabilir):\n${url}\n\nUzakta olsanız da kalben yanımızda olmanızı dileriz.`,
  } as const;
}

export default function WhatsAppAssist({
  url,
  locale,
  names = "",
}: {
  url: string;
  locale: Locale;
  names?: string;
}) {
  const [audience, setAudience] = useState<Audience>("family");
  const copy = useMemo(() => templates(locale, url, names), [locale, url, names]);
  const text = copy[audience];
  const href = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div className="wa-assist">
      <p className="wa-assist__title">{tx(locale, "WhatsApp ile gönder", "Send with WhatsApp")}</p>
      <div className="wa-assist__tabs" role="tablist" aria-label={tx(locale, "Alıcı grubu", "Audience")}>
        {AUDIENCES.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={audience === id}
            className={audience === id ? "is-on" : undefined}
            onClick={() => setAudience(id)}
          >
            {id === "family"
              ? tx(locale, "Aile", "Family")
              : id === "friends"
                ? tx(locale, "Arkadaşlar", "Friends")
                : tx(locale, "Yurtdışı", "Abroad")}
          </button>
        ))}
      </div>
      <textarea className="input wa-assist__text" readOnly rows={6} value={text} aria-label={tx(locale, "Hazır mesaj", "Ready message")} />
      <div className="wa-assist__actions">
        <a className="btn btn--dark" href={href} target="_blank" rel="noopener noreferrer">
          {tx(locale, "WhatsApp’ta aç", "Open in WhatsApp")}
        </a>
        <button
          type="button"
          className="btn btn--outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
            } catch {
              /* ignore */
            }
          }}
        >
          {tx(locale, "Mesajı kopyala", "Copy message")}
        </button>
      </div>
    </div>
  );
}
