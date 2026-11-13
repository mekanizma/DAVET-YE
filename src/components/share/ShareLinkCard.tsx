"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/locale";
import { shareMonths, type SharePublic } from "@/lib/shareSlug";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function when(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ShareLinkCard({ share, locale }: { share: SharePublic | null; locale: Locale }) {
  const [copied, setCopied] = useState(false);
  if (!share) return null;
  const months = shareMonths(share.kind);
  const noun = share.kind === "gazete" ? tx(locale, "gazete", "newspaper") : tx(locale, "davetiye", "invitation");

  async function copy() {
    try {
      await navigator.clipboard.writeText(share!.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="share-card">
      <p className="share-card__title">
        {share.status === "live"
          ? tx(locale, "Online adresiniz", "Your online address")
          : share.status === "reserved"
            ? tx(locale, "Adresiniz ayrıldı", "Your address is reserved")
            : tx(locale, "Adresin süresi doldu", "This address has expired")}
      </p>
      <div className="share-card__url">
        <input className="input" readOnly value={share.url} aria-label={tx(locale, "Paylaşım adresi", "Share address")} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn--dark" onClick={copy}>
          {copied ? tx(locale, "Kopyalandı", "Copied") : tx(locale, "Kopyala", "Copy")}
        </button>
      </div>
      <p className="field__hint">
        {share.status === "live" && share.expiresAt
          ? tx(
              locale,
              `Bu ${noun} ${when(share.expiresAt, locale)} tarihine kadar bu adreste açık kalır.`,
              `This ${noun} stays at this address until ${when(share.expiresAt, locale)}.`,
            )
          : share.status === "reserved"
            ? tx(
                locale,
                `Ödeme onaylanınca ${noun} ${months} ay boyunca bu adreste online görünür.`,
                `Once the payment is confirmed, the ${noun} stays online at this address for ${months} months.`,
              )
            : tx(locale, "Süre bitince adres başkasına açılabilir.", "After the term ends, the address can be given to someone else.")}
      </p>
    </div>
  );
}
