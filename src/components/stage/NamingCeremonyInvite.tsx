"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/locale";
import type { InvitationDraft } from "@/lib/storage";

type Props = {
  locale: Locale;
  draft: InvitationDraft;
  live: boolean;
  title?: string;
  samplePhoto?: string;
  watermark?: boolean;
};

function formatWhen(date: string, time: string, locale: Locale) {
  if (!date) return locale === "en" ? "SUNDAY | JULY 26 | 2:00 PM" : "PAZAR | 26 TEMMUZ | 14:00";
  const iso = `${date}T${(time || "14:00").length === 5 ? `${time}:00` : time}+03:00`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return date;
  const day = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    weekday: "long",
    timeZone: "Europe/Istanbul",
  }).format(d);
  const rest = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  }).format(d);
  const clock = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en",
    timeZone: "Europe/Istanbul",
  }).format(d);
  return `${day} | ${rest} | ${clock}`.toLocaleUpperCase(locale === "en" ? "en-GB" : "tr-TR");
}

export default function NamingCeremonyInvite({ locale, draft, live, title, samplePhoto, watermark }: Props) {
  const en = locale === "en";
  const info = draft.info;
  const photo = (live ? info.albumPhotos?.[0] : "") || samplePhoto || "";
  const [broken, setBroken] = useState(false);

  const copy = useMemo(() => {
    const welcome = (live && info.message.trim()) || (en ? "— Welcome To —" : "— Hoş Geldiniz —");
    const script =
      (live && info.partnerA.trim() && info.partnerB.trim()
        ? en
          ? `${info.partnerA.trim()} & ${info.partnerB.trim()}'s`
          : `${info.partnerA.trim()} & ${info.partnerB.trim()}`
        : live && info.partnerA.trim()
          ? en
            ? `${info.partnerA.trim()}'s`
            : `${info.partnerA.trim()}`
          : en
            ? "Our Baby's"
            : "Bebeğimizin") || (en ? "Our Baby's" : "Bebeğimizin");
    const ceremony =
      (live && info.story.trim()) || title || (en ? "Naming Ceremony" : "İsim Alma Merasimi");
    const when = formatWhen(live ? info.date : "", live ? info.time || "14:00" : "14:00", locale);
    const place =
      (live && (info.venue.trim() || info.address.trim())
        ? [info.venue.trim(), info.address.trim()].filter(Boolean).join(" · ")
        : "") || (en ? "Anywhere Street, Any City" : "Örnek Sokak, İstanbul");
    const rsvp =
      (live && info.closing.trim()) ||
      (en ? "RSVP to mommy at: 123 456 7890" : "Katılım için: 0532 000 00 00");
    return { welcome, script, ceremony, when, place, rsvp };
  }, [live, info, en, locale, title]);

  return (
    <div className="nci-root" data-layout="namingCeremony">
      <div className="nci-phone" role="img" aria-label={copy.ceremony}>
        <div className="nci-card">
          <div className="nci-spark nci-spark--a" aria-hidden="true" />
          <div className="nci-spark nci-spark--b" aria-hidden="true" />
          <div className="nci-spark nci-spark--c" aria-hidden="true" />

          <p className="nci-welcome">{copy.welcome}</p>
          <h1 className="nci-script">{copy.script}</h1>
          <p className="nci-ceremony">{copy.ceremony}</p>

          <div className="nci-frame">
            {photo && !broken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="nci-photo" onError={() => setBroken(true)} />
            ) : (
              <div className="nci-photo nci-photo--empty" aria-hidden="true">
                <span>{en ? "Add a photo" : "Fotoğraf ekleyin"}</span>
              </div>
            )}
            <div className="nci-bunny" aria-hidden="true">
              <svg viewBox="0 0 64 72" width="54" height="60">
                <ellipse cx="32" cy="48" rx="18" ry="16" fill="#f3e6d8" />
                <ellipse cx="22" cy="18" rx="7" ry="16" fill="#f3e6d8" />
                <ellipse cx="42" cy="18" rx="7" ry="16" fill="#f3e6d8" />
                <ellipse cx="22" cy="18" rx="3" ry="10" fill="#ecc9b8" />
                <ellipse cx="42" cy="18" rx="3" ry="10" fill="#ecc9b8" />
                <circle cx="26" cy="46" r="2" fill="#6b4a32" />
                <circle cx="38" cy="46" r="2" fill="#6b4a32" />
                <ellipse cx="32" cy="52" rx="3" ry="2" fill="#e8a090" />
              </svg>
            </div>
            <div className="nci-bloom" aria-hidden="true" />
          </div>

          <p className="nci-when">{copy.when}</p>
          <p className="nci-place">{copy.place}</p>
          <p className="nci-rsvp">{copy.rsvp}</p>
        </div>
        {watermark ? <div className="nci-mark">{en ? "Preview" : "Önizleme"}</div> : null}
      </div>
    </div>
  );
}
