"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import InviteMusic from "@/components/InviteMusic";
import { usePagedGestures } from "@/hooks/usePagedGestures";
import type { Locale } from "@/i18n/locale";
import { buildIcs, downloadBlob } from "@/lib/format";
import {
  BABY_DEFAULT_MESSAGE_EN,
  BABY_DEFAULT_MESSAGE_TR,
  BABY_DEFAULT_TITLE_EN,
  BABY_DEFAULT_TITLE_TR,
  type InvitationDraft,
} from "@/lib/storage";

type Props = {
  locale: Locale;
  draft: InvitationDraft;
  live: boolean;
  title?: string;
  coverSrc?: string;
  decorSrc?: string;
  palette?: "peach" | "sage" | "sky";
  samplePhoto?: string;
  watermark?: boolean;
  musicSrc?: string | null;
};

type PageId = "welcome" | "when" | "theme" | "rsvp";

function formatWhen(date: string, time: string, locale: Locale) {
  if (!date) return locale === "en" ? "SUNDAY | JUNE 14 | 3:00 PM" : "PAZAR | 14 HAZİRAN | 15:00";
  const iso = `${date}T${(time || "15:00").length === 5 ? `${time}:00` : time}+03:00`;
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

function formatDeadline(date: string, locale: Locale) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00+03:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(d);
}

export default function BabyShowerInvite({
  locale,
  draft,
  live,
  coverSrc,
  decorSrc,
  palette = "peach",
  watermark,
  musicSrc = null,
}: Props) {
  const en = locale === "en";
  const info = draft.info;
  const [calDone, setCalDone] = useState(false);
  const [phase, setPhase] = useState<"gate" | "opening" | "open">("gate");
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (phase !== "opening") return;
    const t = window.setTimeout(() => setPhase("open"), 1100);
    return () => window.clearTimeout(t);
  }, [phase]);

  const copy = useMemo(() => {
    const title =
      (live && info.familyNote.trim()) || (en ? BABY_DEFAULT_TITLE_EN : BABY_DEFAULT_TITLE_TR);
    const message =
      (live && info.message.trim()) || (en ? BABY_DEFAULT_MESSAGE_EN : BABY_DEFAULT_MESSAGE_TR);
    const baby = (live && info.story.trim()) || (en ? "Little Ada" : "Minik Ada");
    const hosts =
      live && (info.partnerA.trim() || info.partnerB.trim())
        ? [info.partnerA.trim(), info.partnerB.trim()].filter(Boolean).join(" & ")
        : "Elif & Can";
    const when = formatWhen(live ? info.date : "", live ? info.time || "15:00" : "15:00", locale);
    const venue =
      (live && info.venue.trim()) || (en ? "Garden Terrace" : "Garden Terrace");
    const address =
      (live && info.address.trim()) || (en ? "Istanbul" : "İstanbul");
    const place = [venue, address].filter(Boolean).join(" · ");
    const theme =
      (live && info.dressCode.trim()) ||
      (en ? "Pastel blue & cream" : "Pastel mavi & krem");
    const phone =
      (live && info.closing.trim()) || (en ? "0532 000 00 00" : "0532 000 00 00");
    const deadlineRaw = live ? info.kinaDate.trim() : "2026-06-01";
    const deadline = formatDeadline(deadlineRaw, locale);
    const mapQuery =
      [info.venue.trim(), info.address.trim(), info.place.trim()].filter(Boolean).join(" ") ||
      (en ? "Garden Terrace Istanbul" : "Garden Terrace İstanbul");
    return { title, message, baby, hosts, when, venue, address, place, theme, phone, deadline, mapQuery };
  }, [live, info, en, locale]);

  function eventStart() {
    const date = live && info.date ? info.date : "2026-06-14";
    const time = (live && info.time ? info.time : "15:00").slice(0, 5);
    return new Date(`${date}T${time}:00+03:00`);
  }

  function addToCalendar() {
    const start = eventStart();
    if (Number.isNaN(start.getTime())) return;
    const title = `${copy.title} — ${copy.baby}`;
    const location = copy.place;
    const description = `${copy.hosts} · ${copy.message}`;
    const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const end = new Date(start.getTime() + 3 * 3600000);
    const gcal = new URL("https://calendar.google.com/calendar/render");
    gcal.searchParams.set("action", "TEMPLATE");
    gcal.searchParams.set("text", title);
    gcal.searchParams.set("dates", `${utc(start)}/${utc(end)}`);
    gcal.searchParams.set("location", location);
    gcal.searchParams.set("details", description);
    window.open(gcal.toString(), "_blank", "noopener,noreferrer");
    downloadBlob(
      "baby-shower.ics",
      new Blob([buildIcs({ title, start, durationMinutes: 180, location, description })], {
        type: "text/calendar;charset=utf-8",
      }),
    );
    setCalDone(true);
    window.setTimeout(() => setCalDone(false), 2200);
  }

  function openMap() {
    const custom = (live ? info.mapUrl : "").trim();
    if (custom) {
      window.open(custom, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(copy.mapQuery)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const pages = useMemo(() => {
    const list: PageId[] = ["welcome", "when"];
    if (copy.theme) list.push("theme");
    list.push("rsvp");
    return list;
  }, [copy.theme]);

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  function openInvite() {
    setPhase((current) => (current === "gate" ? "opening" : current));
  }

  const go = useCallback((dir: -1 | 1) => {
    setPage((current) => Math.min(pages.length - 1, Math.max(0, current + dir)));
  }, [pages.length]);

  const pagesRef = usePagedGestures(phase === "open", go);
  const current = pages[page] || "welcome";

  return (
    <div className="bsi-root" data-layout="babyShower" data-palette={palette} data-phase={phase}>
      <div className="bsi-phone" aria-label={copy.title}>
        {phase !== "open" ? (
          <button
            type="button"
            className={`bsi-gate${phase === "opening" ? " is-opening" : ""}`}
            onClick={openInvite}
            aria-label={en ? "Open invitation" : "Davetiyeyi aç"}
          >
            <div className="bsi-gate__art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverSrc || "/img/davetiye/pastel-bulut-baby-shower/kapak.jpg"} alt="" />
            </div>
            <div className="bsi-gate__seal" aria-hidden="true">
              <span>♥</span>
            </div>
            <div className="bsi-gate__copy">
              <p className="bsi-gate__eyebrow">BABY SHOWER</p>
              <h2 className="bsi-gate__name">{copy.baby}</h2>
              <p className="bsi-gate__hint">{en ? "Tap to open" : "Açmak için dokun"}</p>
            </div>
            <div className="bsi-gate__balloons" aria-hidden="true">
              <i className="bsi-balloon bsi-balloon--a" />
              <i className="bsi-balloon bsi-balloon--b" />
              <i className="bsi-balloon bsi-balloon--c" />
            </div>
          </button>
        ) : (
          <div className="bsi-stage">
            {decorSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="bsi-decor" src={decorSrc} alt="" aria-hidden="true" />
            ) : null}
            <div className="bsi-cloud bsi-cloud--a" aria-hidden="true" />
            <div className="bsi-cloud bsi-cloud--b" aria-hidden="true" />
            <div className="bsi-star bsi-star--a" aria-hidden="true" />
            <div className="bsi-star bsi-star--b" aria-hidden="true" />
            <div className="bsi-star bsi-star--c" aria-hidden="true" />

            <div ref={pagesRef} className="bsi-pages" aria-live="polite">
              {current === "welcome" ? (
                <section className="bsi-page is-in" aria-label={en ? "Welcome" : "Davet"}>
                  <p className="bsi-eyebrow">BABY SHOWER</p>
                  <h1 className="bsi-baby">{copy.title}</h1>
                  <p className="bsi-welcome">{copy.message}</p>
                  <p className="bsi-event">{en ? "Baby" : "Bebeğimiz"}</p>
                  <p className="bsi-hosts">
                    <strong>{copy.baby}</strong>
                  </p>
                  <p className="bsi-hosts">
                    {en ? "Expectant parents" : "Anne & baba adayları"} <strong>{copy.hosts}</strong>
                  </p>
                </section>
              ) : null}

              {current === "when" ? (
                <section className="bsi-page is-in" aria-label={en ? "Date & place" : "Tarih ve mekân"}>
                  <p className="bsi-eyebrow">{en ? "When & where" : "Ne zaman & nerede"}</p>
                  <h2 className="bsi-page-title">{en ? "Join us" : "Sizleri bekliyoruz"}</h2>
                  <p className="bsi-when">{copy.when}</p>
                  <p className="bsi-place">
                    <strong>{copy.venue}</strong>
                    <br />
                    {copy.address}
                  </p>
                  <div className="bsi-actions">
                    <button type="button" className="bsi-btn" onClick={addToCalendar}>
                      <Icon name={calDone ? "check" : "calendar"} size={16} />
                      {calDone ? (en ? "Added" : "Eklendi") : en ? "Add to calendar" : "Takvime Ekle"}
                    </button>
                    <button type="button" className="bsi-btn" onClick={openMap}>
                      <Icon name="pin" size={16} />
                      {en ? "Show location" : "Konumu Göster"}
                    </button>
                  </div>
                </section>
              ) : null}

              {current === "theme" ? (
                <section className="bsi-page is-in" aria-label={en ? "Theme" : "Tema"}>
                  <p className="bsi-eyebrow">{en ? "Look & feel" : "Kıyafet / tema"}</p>
                  <h2 className="bsi-page-title">{en ? "Colors & theme" : "Renkler & tema"}</h2>
                  <p className="bsi-thanks">{copy.theme}</p>
                </section>
              ) : null}

              {current === "rsvp" ? (
                <section className="bsi-page is-in" aria-label={en ? "RSVP" : "LCV"}>
                  <p className="bsi-eyebrow">{en ? "RSVP" : "Katılım bildirimi"}</p>
                  <h2 className="bsi-page-title">{en ? "Please reply" : "Lütfen yanıtlayın"}</h2>
                  <p className="bsi-rsvp">
                    {en ? "Contact" : "İletişim"}: <strong>{copy.phone}</strong>
                  </p>
                  {copy.deadline ? (
                    <p className="bsi-thanks">
                      {en ? "RSVP by" : "Son yanıt tarihi"}: <strong>{copy.deadline}</strong>
                    </p>
                  ) : null}
                  <div className="bsi-actions">
                    <button type="button" className="bsi-btn" onClick={addToCalendar}>
                      <Icon name={calDone ? "check" : "calendar"} size={16} />
                      {calDone ? (en ? "Added" : "Eklendi") : en ? "Add to calendar" : "Takvime Ekle"}
                    </button>
                    <button type="button" className="bsi-btn" onClick={openMap}>
                      <Icon name="pin" size={16} />
                      {en ? "Show location" : "Konumu Göster"}
                    </button>
                  </div>
                </section>
              ) : null}
            </div>

            <div className="bsi-nav">
              <button type="button" className="bsi-nav__btn" disabled={page <= 0} onClick={() => go(-1)} aria-label={en ? "Previous page" : "Önceki sayfa"}>
                ˄
              </button>
              <div className="bsi-dots" aria-hidden="true">
                {pages.map((id, idx) => (
                  <i key={id} className={idx === page ? "is-on" : undefined} />
                ))}
              </div>
              <button type="button" className="bsi-nav__btn" disabled={page >= pages.length - 1} onClick={() => go(1)} aria-label={en ? "Next page" : "Sonraki sayfa"}>
                ˅
              </button>
            </div>
          </div>
        )}
        {watermark ? <div className="bsi-mark">{en ? "Preview" : "Önizleme"}</div> : null}
        <InviteMusic
          src={musicSrc}
          play={phase !== "gate"}
          floating
          labelOn={en ? "Mute music" : "Müziği kapat"}
          labelOff={en ? "Play music" : "Müziği aç"}
        />
      </div>
    </div>
  );
}
