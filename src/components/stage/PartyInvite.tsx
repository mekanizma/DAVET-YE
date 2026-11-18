"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Icon from "@/components/Icon";
import InviteMusic from "@/components/InviteMusic";
import { usePagedGestures } from "@/hooks/usePagedGestures";
import type { Locale } from "@/i18n/locale";
import { buildIcs, downloadBlob } from "@/lib/format";
import type { InvitationDraft } from "@/lib/storage";

const COVER = "/img/davetiye/gece-isigi-parti/kapak.jpg";
const DECOR = "/img/davetiye/gece-isigi-parti/dekor.jpg";

type Phase = "gate" | "opening" | "open";
type PageId = "welcome" | "when" | "where" | "rsvp" | "dress" | "program" | "menu" | "notes";

type Props = {
  locale: Locale;
  draft: InvitationDraft;
  watermark?: boolean;
  coverSrc?: string;
  decorSrc?: string;
  musicSrc?: string | null;
};

function formatDay(date: string, locale: Locale) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00+03:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(d);
}

function clock(value: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function waHref(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  if (digits.length < 10) return "";
  return `https://wa.me/${digits}`;
}

function spanMinutes(date: string, start: string, end: string) {
  const from = clock(start);
  const to = clock(end);
  if (!date || !from || !to) return 240;
  const a = new Date(`${date}T${from}:00+03:00`).getTime();
  let b = new Date(`${date}T${to}:00+03:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 240;
  if (b <= a) b += 24 * 3600000;
  return Math.max(30, Math.round((b - a) / 60000));
}

export default function PartyInvite({ locale, draft, watermark, coverSrc, decorSrc, musicSrc = null }: Props) {
  const en = locale === "en";
  const info = draft.info;
  const cover = coverSrc || COVER;
  const decor = decorSrc || DECOR;
  const [phase, setPhase] = useState<Phase>("gate");
  const [calDone, setCalDone] = useState(false);

  useEffect(() => {
    if (phase !== "opening") return;
    const timer = window.setTimeout(() => setPhase("open"), 1050);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const copy = useMemo(() => {
    const title = info.familyNote.trim();
    const kind = info.partyKind.trim();
    const host = [info.partnerA.trim(), info.partnerB.trim()].filter(Boolean).join(" · ");
    const message = info.message.trim();
    const day = formatDay(info.date, locale);
    const start = clock(info.time);
    const end = clock(info.endTime);
    const hours = [start, end].filter(Boolean).join(" – ");
    const venue = info.venue.trim();
    const address = info.address.trim();
    const guest = info.guestNote.trim();
    const deadline = formatDay(info.kinaDate, locale);
    const phone = info.closing.trim();
    const dress = info.dressCode.trim();
    const menu = info.menu.trim();
    const age = info.ageNote.trim();
    const ticket = info.ticketNote.trim();
    const transport = info.transportNote.trim();
    const note = info.extraNote.trim();
    const program = (draft.program || []).filter((row) => row.time.trim() || row.title.trim());
    const mapQuery = [venue, address, info.place.trim()].filter(Boolean).join(" ");
    return {
      title, kind, host, message, day, hours, start, venue, address, guest, deadline,
      phone, dress, menu, age, ticket, transport, note, program, mapQuery,
    };
  }, [draft.program, info, locale]);

  function addToCalendar() {
    const date = info.date || "2026-11-21";
    const start = clock(info.time) || "21:00";
    const begin = new Date(`${date}T${start}:00+03:00`);
    if (Number.isNaN(begin.getTime())) return;
    const title = copy.title || (en ? "Party" : "Parti");
    const location = [copy.venue, copy.address].filter(Boolean).join(", ");
    const description = [copy.host, copy.message, copy.kind].filter(Boolean).join("\n");
    const minutes = spanMinutes(date, start, info.endTime);
    const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const finish = new Date(begin.getTime() + minutes * 60000);
    const gcal = new URL("https://calendar.google.com/calendar/render");
    gcal.searchParams.set("action", "TEMPLATE");
    gcal.searchParams.set("text", title);
    gcal.searchParams.set("dates", `${utc(begin)}/${utc(finish)}`);
    gcal.searchParams.set("location", location);
    gcal.searchParams.set("details", description);
    window.open(gcal.toString(), "_blank", "noopener,noreferrer");
    downloadBlob(
      "parti.ics",
      new Blob([buildIcs({ title, start: begin, durationMinutes: minutes, location, description })], {
        type: "text/calendar;charset=utf-8",
      }),
    );
    setCalDone(true);
    window.setTimeout(() => setCalDone(false), 2200);
  }

  function openMap() {
    const custom = info.mapUrl.trim();
    if (custom) {
      window.open(custom, "_blank", "noopener,noreferrer");
      return;
    }
    const query = copy.mapQuery || (en ? "Istanbul" : "İstanbul");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  const whatsapp = waHref(copy.phone);
  const shownTitle = copy.title || (en ? "Party" : "Parti");
  const pages = useMemo(() => {
    const list: PageId[] = ["welcome"];
    if (copy.day || copy.hours) list.push("when");
    if (copy.venue || copy.address) list.push("where");
    if (copy.guest || copy.deadline || copy.phone) list.push("rsvp");
    if (copy.dress) list.push("dress");
    if (copy.program.length) list.push("program");
    if (copy.menu) list.push("menu");
    if (copy.age || copy.ticket || copy.transport || copy.note) list.push("notes");
    return list;
  }, [copy]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const go = useCallback((dir: -1 | 1) => {
    setPage((current) => Math.min(pages.length - 1, Math.max(0, current + dir)));
  }, [pages.length]);

  const pagesRef = usePagedGestures(phase === "open", go);
  const current = pages[page] || "welcome";

  return (
    <div className="pti-root" data-layout="party">
      <div className="pti-phone">
        {phase !== "open" ? (
          <button
            type="button"
            className={`pti-gate${phase === "opening" ? " is-opening" : ""}`}
            onClick={() => setPhase((current) => (current === "gate" ? "opening" : current))}
            data-music-open="1"
          >
            <span className="pti-gate__art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" />
              <span className="pti-gate__glow" />
            </span>
            <span className="pti-lights" aria-hidden="true">
              <i /><i /><i /><i /><i /><i /><i />
            </span>
            <span className="pti-confetti" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
            </span>
            <span className="pti-gate__copy">
              <span className="pti-kicker">Parti</span>
              {copy.kind ? <span className="pti-kind">{copy.kind}</span> : null}
              <strong className="pti-title">{shownTitle}</strong>
              {copy.host ? <span className="pti-host">{copy.host}</span> : null}
              <span className="pti-tap">{en ? "Tap to open" : "Açmak için dokun"}</span>
            </span>
          </button>
        ) : (
          <div className="pti-stage">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pti-stage__bg" src={decor} alt="" />
            <span className="pti-confetti pti-confetti--soft" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
            </span>
            <div ref={pagesRef} className="pti-pages" aria-live="polite">
              {current === "welcome" ? (
                <section className="pti-page pti-page--welcome" key="welcome" aria-label={en ? "Invitation" : "Davet"}>
                  <PageFrame>
                    {watermark ? <p className="pti-preview">{en ? "Preview" : "Önizleme"}</p> : null}
                    <Eyebrow>{en ? "You’re invited" : "Davetlisiniz"}</Eyebrow>
                    {copy.kind ? <p className="pti-kind">{copy.kind}</p> : null}
                    <h1 className="pti-title">{shownTitle}</h1>
                    <span className="pti-ornament" aria-hidden="true" />
                    {copy.host ? (
                      <p className="pti-host">
                        <span>{en ? "Hosted by" : "Ev sahibi"}</span>
                        <strong>{copy.host}</strong>
                      </p>
                    ) : null}
                    {copy.message ? <p className="pti-message">{copy.message}</p> : null}
                  </PageFrame>
                </section>
              ) : null}
              {current === "when" ? (
                <section className="pti-page pti-page--when" key="when" aria-label={en ? "When" : "Ne zaman"}>
                  <PageFrame>
                    <Eyebrow>{en ? "When" : "Ne zaman"}</Eyebrow>
                    {copy.day ? <p className="pti-day">{copy.day}</p> : null}
                    {copy.hours ? (
                      <p className="pti-hours">
                        <Icon name="clock" size={18} />
                        <span>{copy.hours}</span>
                      </p>
                    ) : null}
                    <span className="pti-ornament" aria-hidden="true" />
                    <button type="button" className="pti-btn pti-btn--solid" onClick={addToCalendar}>
                      <Icon name={calDone ? "check" : "calendar"} size={16} />
                      {calDone ? (en ? "Added" : "Eklendi") : en ? "Add to calendar" : "Takvime ekle"}
                    </button>
                  </PageFrame>
                </section>
              ) : null}
              {current === "where" ? (
                <section className="pti-page pti-page--where" key="where" aria-label={en ? "Where" : "Nerede"}>
                  <PageFrame>
                    <Eyebrow>{en ? "Where" : "Nerede"}</Eyebrow>
                    <div className="pti-pin" aria-hidden="true">
                      <Icon name="pin" size={22} />
                    </div>
                    {copy.venue ? <p className="pti-venue">{copy.venue}</p> : null}
                    {copy.address ? <p className="pti-address">{copy.address}</p> : null}
                    <button type="button" className="pti-btn pti-btn--ghost" onClick={openMap}>
                      <Icon name="pin" size={16} />
                      {en ? "Open map" : "Haritada aç"}
                    </button>
                  </PageFrame>
                </section>
              ) : null}
              {current === "rsvp" ? (
                <section className="pti-page pti-page--rsvp" key="rsvp" aria-label={en ? "RSVP" : "Katılım"}>
                  <PageFrame>
                    <Eyebrow>{en ? "RSVP" : "Katılım"}</Eyebrow>
                    <div className="pti-stack">
                      {copy.guest ? <Fact label={en ? "Attendance" : "Katılım durumu"} value={copy.guest} /> : null}
                      {copy.deadline ? <Fact label={en ? "Reply by" : "Son bildirim"} value={copy.deadline} /> : null}
                      {copy.phone ? <Fact label="WhatsApp" value={copy.phone} /> : null}
                    </div>
                    {whatsapp ? (
                      <a className="pti-btn pti-btn--wa" href={whatsapp} target="_blank" rel="noopener noreferrer">
                        <Icon name="whatsapp" size={16} />
                        WhatsApp
                      </a>
                    ) : null}
                  </PageFrame>
                </section>
              ) : null}
              {current === "dress" ? (
                <section className="pti-page pti-page--dress" key="dress" aria-label={en ? "Dress" : "Kıyafet"}>
                  <PageFrame>
                    <Eyebrow>{en ? "Dress code" : "Kıyafet"}</Eyebrow>
                    <p className="pti-quote">{copy.dress}</p>
                    <span className="pti-ornament" aria-hidden="true" />
                  </PageFrame>
                </section>
              ) : null}
              {current === "program" ? (
                <section className="pti-page pti-page--program" key="program" aria-label={en ? "Program" : "Program"}>
                  <PageFrame>
                    <Eyebrow>{en ? "Program" : "Program"}</Eyebrow>
                    <ol className="pti-program">
                      {copy.program.map((row, index) => (
                        <li key={`${row.time}-${row.title}-${index}`}>
                          {row.time ? <time>{row.time}</time> : <span className="pti-program__empty">·</span>}
                          <div>
                            {row.title ? <strong>{row.title}</strong> : null}
                            {row.note ? <small>{row.note}</small> : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </PageFrame>
                </section>
              ) : null}
              {current === "menu" ? (
                <section className="pti-page pti-page--menu" key="menu" aria-label={en ? "Food and drink" : "Yiyecek ve içecek"}>
                  <PageFrame>
                    <Eyebrow>{en ? "Food & drink" : "Yiyecek ve içecek"}</Eyebrow>
                    <p className="pti-quote">{copy.menu}</p>
                    <span className="pti-ornament" aria-hidden="true" />
                  </PageFrame>
                </section>
              ) : null}
              {current === "notes" ? (
                <section className="pti-page pti-page--notes" key="notes" aria-label={en ? "Details" : "Ayrıntılar"}>
                  <PageFrame>
                    <Eyebrow>{en ? "Details" : "Ayrıntılar"}</Eyebrow>
                    <div className="pti-stack">
                      {copy.age ? <Fact label={en ? "Age" : "Yaş sınırı"} value={copy.age} /> : null}
                      {copy.ticket ? <Fact label={en ? "Ticket" : "Ücret"} value={copy.ticket} /> : null}
                      {copy.transport ? <Fact label={en ? "Getting there" : "Ulaşım ve otopark"} value={copy.transport} /> : null}
                      {copy.note ? <Fact label={en ? "Note" : "Not"} value={copy.note} /> : null}
                    </div>
                  </PageFrame>
                </section>
              ) : null}
            </div>
            <div className="pti-nav">
              <button type="button" className="pti-nav__btn" disabled={page <= 0} onClick={() => go(-1)} aria-label={en ? "Previous page" : "Önceki sayfa"}>
                ˄
              </button>
              <div className="pti-dots" aria-hidden="true">
                {pages.map((id, index) => (
                  <i key={id} className={index === page ? "is-on" : undefined} />
                ))}
              </div>
              <button type="button" className="pti-nav__btn" disabled={page >= pages.length - 1} onClick={() => go(1)} aria-label={en ? "Next page" : "Sonraki sayfa"}>
                ˅
              </button>
            </div>
          </div>
        )}
        {watermark && phase !== "open" ? <div className="pti-mark">{en ? "Preview" : "Önizleme"}</div> : null}
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

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="pti-card">
      <span className="pti-card__foil" aria-hidden="true" />
      <span className="pti-card__corner pti-card__corner--tl" aria-hidden="true" />
      <span className="pti-card__corner pti-card__corner--tr" aria-hidden="true" />
      <span className="pti-card__corner pti-card__corner--bl" aria-hidden="true" />
      <span className="pti-card__corner pti-card__corner--br" aria-hidden="true" />
      <div className="pti-card__body">{children}</div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="pti-eyebrow">
      <span className="pti-eyebrow__rule" aria-hidden="true" />
      <span>{children}</span>
      <span className="pti-eyebrow__rule" aria-hidden="true" />
    </p>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <p className="pti-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}
