"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ShareLinkCard from "@/components/share/ShareLinkCard";
import type { Locale } from "@/i18n/locale";
import type { SharePublic } from "@/lib/shareSlug";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

export default function RepublishPanel({
  locale,
  code,
  design,
  names = "",
  initialShare = null,
}: {
  locale: Locale;
  code: string;
  design: unknown;
  names?: string;
  initialShare?: SharePublic | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [share, setShare] = useState<SharePublic | null>(initialShare);

  async function republish() {
    setBusy(true);
    setError("");
    setDone("");
    try {
      const res = await fetch("/api/hesap/yayin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, design, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tx(locale, "Yeniden yayınlanamadı.", "Could not republish."));
        return;
      }
      setShare(data.share || null);
      setDone(tx(locale, "Değişiklikler aynı linkte yayına alındı.", "Your changes are live on the same link."));
    } catch {
      setError(tx(locale, "Bağlantı kurulamadı. Yeniden deneyin.", "The connection could not be made. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="iban-pay">
      <div className="alert alert--info" role="note">
        <Icon name="info" size={18} />
        <span>
          {tx(
            locale,
            "Ödeme alınmış. Düzenlemeyi kaydedince davet linki değişmeden yeniden yayınlanır.",
            "Payment is already complete. When you save, the invitation link stays the same and goes live again.",
          )}
        </span>
      </div>
      {error ? (
        <div className="alert alert--error" role="alert">
          <Icon name="alert" size={18} />
          <span>{error}</span>
        </div>
      ) : null}
      {done ? (
        <div className="alert alert--success" role="status">
          <Icon name="check" size={18} />
          <span>{done}</span>
        </div>
      ) : null}
      <button type="button" className="btn btn--dark btn--lg btn--block btn--serif" disabled={busy} onClick={republish}>
        <Icon name="sparkle" size={16} />
        {busy
          ? tx(locale, "Yayınlanıyor…", "Publishing…")
          : tx(locale, "Aynı linkle yeniden yayınla", "Republish on the same link")}
      </button>
      <ShareLinkCard share={share} locale={locale} names={names} />
    </div>
  );
}
