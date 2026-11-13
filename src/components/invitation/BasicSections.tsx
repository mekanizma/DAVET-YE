"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import Icon from "../Icon";
import { Divider } from "./Decor";
import { useIv } from "./ctx";
import { useLocale } from "@/i18n/provider";
import { TR_DAYS, TR_MONTHS, buildIcs, downloadBlob, longDate, pad2, weekdayName } from "@/lib/format";

/** Section wrapper: full-height page with themed backdrop + next-page button. */
export function Sec({
  id,
  title,
  children,
  last = false,
  bare = false,
  cardClass = "",
}: {
  id: string;
  title: string;
  children: ReactNode;
  last?: boolean;
  /** render without paper card (text directly on the cover backdrop) */
  bare?: boolean;
  cardClass?: string;
}) {
  const { reduced } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  return (
    <section id={`iv-${id}`} className="iv-sec" aria-label={title} data-sec={id}>
      <div className={bare ? "iv-sec__bare" : `iv-card ${cardClass}`}>{children}</div>
      {!last && (
        <button
          type="button"
          className="iv-next"
          aria-label={en ? "Next page" : "Sayfa geçişi"}
          onClick={(e) => {
            const sec = (e.currentTarget as HTMLElement).closest("section");
            sec?.nextElementSibling?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
          }}
        >
          <Icon name="chevron-down" size={22} />
        </button>
      )}
    </section>
  );
}

export function NamesSection() {
  const { data, style } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  return (
    <Sec id="isimler" title={en ? "Names" : "İsimler"} bare>
      <p className="iv-lead">{style.lead}</p>
      <h2 className={`iv-names iv-names--${style.nameFont}`}>
        <span>{data.partnerA}</span>
        <span className="iv-names__amp" aria-hidden="true">&amp;</span>
        <span className="sr-only">{en ? " and " : " ve "}</span>
        <span>{data.partnerB}</span>
      </h2>
      <p className="iv-date-line">{longDate(data.date, locale)}</p>
      <p className="iv-msg">{data.message}</p>
    </Sec>
  );
}

export function FamiliesSection() {
  const { data, style } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  return (
    <Sec id="aileler" title={en ? "Families" : "Aileler"}>
      <p className="iv-kicker">{en ? "Our families" : "Ailelerimiz"}</p>
      <Divider kind={style.ornament} />
      <div className="iv-families">
        <div>
          <h3>{en ? "The bride's family" : "Gelinin Ailesi"}</h3>
          <p>{data.brideFamily}</p>
        </div>
        <div>
          <h3>{en ? "The groom's family" : "Damadın Ailesi"}</h3>
          <p>{data.groomFamily}</p>
        </div>
      </div>
      <p className="iv-msg iv-msg--soft">{data.familyMessage}</p>
    </Sec>
  );
}

function CalendarButton({ label, date, title }: { label: string; date: Date; title: string }) {
  const { data } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="iv-btn"
      onClick={() => {
        const ics = buildIcs({
          title,
          start: date,
          location: `${data.venue}, ${data.address}`,
          description: en
            ? `${data.partnerA} & ${data.partnerB} invitation`
            : `${data.partnerA} & ${data.partnerB} davetiyesi`,
        });
        downloadBlob(
          en ? "invitation.ics" : "davetiye.ics",
          new Blob([ics], { type: "text/calendar;charset=utf-8" }),
        );
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      }}
    >
      <Icon name={done ? "check" : "calendar"} size={16} /> {done ? (en ? "Calendar file downloaded" : "Takvim dosyası indirildi") : label}
    </button>
  );
}

function dayLine(date: Date, en: boolean) {
  if (en) return `${weekdayName(date, "en")}, ${longDate(date, "en")}`;
  return `${date.getDate()} ${TR_MONTHS[date.getMonth()]} ${TR_DAYS[date.getDay()]}`;
}

function DateBlock({ date, caption, label }: { date: Date; caption?: string; label: string }) {
  const { data } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  return (
    <div className="iv-dateblock">
      {caption && <p className="iv-dateblock__cap">{caption}</p>}
      <p className="iv-dateblock__day">{dayLine(date, en)}</p>
      <p className="iv-dateblock__time">
        {en ? "at" : "Saat"} <strong className="num">{pad2(date.getHours())}:{pad2(date.getMinutes())}</strong>
      </p>
      <CalendarButton label={en ? "Add to calendar" : "Takvime Ekle"} date={date} title={`${label} — ${data.partnerA} & ${data.partnerB}`} />
    </div>
  );
}

export function DateSection() {
  const { data, style } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  return (
    <Sec id="tarih" title={en ? "Date" : "Tarih"}>
      <p className="iv-kicker">{en ? "Date" : "Tarih"}</p>
      <Divider kind={style.ornament} />
      {data.kinaDate ? (
        <div className="iv-dates">
          <DateBlock date={data.kinaDate} caption={en ? "Henna night" : "Kına Gecesi"} label={en ? "Henna night" : "Kına Gecesi"} />
          <DateBlock date={data.date} caption={en ? "Wedding" : "Düğün"} label={en ? "Wedding" : "Düğün"} />
        </div>
      ) : (
        <DateBlock date={data.date} label={en ? "Wedding" : "Düğün"} />
      )}
    </Sec>
  );
}

export function LocationSection() {
  const { data, style } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  const q = encodeURIComponent(`${data.venue} ${data.address}`);
  return (
    <Sec id="konum" title={en ? "Location" : "Konum"}>
      <p className="iv-kicker">{en ? "Location" : "Konum"}</p>
      <Divider kind={style.ornament} />
      {/* Static, locally drawn map placeholder: no third-party embed or tracking. */}
      <div className="iv-map" role="img" aria-label={en ? `${data.venue} location` : `${data.venue} konumu`}>
        <span className="iv-map__road iv-map__road--a" />
        <span className="iv-map__road iv-map__road--b" />
        <span className="iv-map__road iv-map__road--c" />
        <span className="iv-map__water" />
        <span className="iv-map__pin"><Icon name="pin" size={30} /></span>
      </div>
      <p className="iv-venue">{data.venue}</p>
      <p className="iv-address">{data.address}</p>
      <a
        className="iv-btn"
        href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="route" size={16} /> {en ? "Get directions" : "Yol Tarifi"}
      </a>
    </Sec>
  );
}

function diff(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    over: ms === 0,
  };
}

export function CountdownSection() {
  const { data, style } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const r = now ? diff(data.date, now) : null;
  const cells: { key: string; label: string; value: number | null; pad: boolean }[] = [
    { key: "d", label: en ? "Days" : "Gün", value: r ? r.d : null, pad: false },
    { key: "h", label: en ? "Hours" : "Saat", value: r ? r.h : null, pad: true },
    { key: "m", label: en ? "Minutes" : "Dakika", value: r ? r.m : null, pad: true },
    { key: "s", label: en ? "Seconds" : "Saniye", value: r ? r.s : null, pad: true },
  ];
  return (
    <Sec id="geri-sayim" title={en ? "Countdown" : "Geri sayım"}>
      <p className="iv-kicker">{en ? "Time until the big day" : "Büyük Güne Kalan Zaman"}</p>
      <Divider kind={style.ornament} />
      <div className="iv-count" role="timer" aria-live="off">
        {cells.map((cell) => (
          <div key={cell.key} className="iv-count__cell">
            <strong className="num">{cell.value === null ? "--" : cell.pad ? pad2(cell.value) : cell.value}</strong>
            <span>{cell.label}</span>
          </div>
        ))}
      </div>
      <p className="iv-date-line">
        {longDate(data.date, locale)} {weekdayName(data.date, locale)}
      </p>
      {r?.over && <p className="iv-msg">{en ? "The big day is here!" : "Büyük gün geldi!"}</p>}
    </Sec>
  );
}

export function ProgramSection() {
  const { data, style } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  return (
    <Sec id="program" title={en ? "Programme" : "Program akışı"}>
      <p className="iv-kicker">{en ? "Programme" : "Program"}</p>
      <Divider kind={style.ornament} />
      <ol className="iv-timeline">
        {data.program.map((p) => (
          <li key={p.time}>
            <time className="num">{p.time}</time>
            <div>
              <strong>{p.title}</strong>
              {p.text && <span>{p.text}</span>}
            </div>
          </li>
        ))}
      </ol>
    </Sec>
  );
}

export function ClosingSection({
  exitHref,
  startHref,
  embed,
  onTop,
}: {
  exitHref: string;
  startHref: string;
  embed: boolean;
  onTop: () => void;
}) {
  const { data, style } = useIv();
  const locale = useLocale();
  const en = locale === "en";
  return (
    <Sec id="kapanis" title={en ? "Closing" : "Kapanış"} last>
      <p className="iv-kicker">{en ? "Thank you" : "Teşekkürler"}</p>
      <Divider kind={style.ornament} />
      <p className="iv-msg">{data.closing}</p>
      <p className="iv-signoff">
        {data.partnerA} &amp; {data.partnerB}
      </p>
      <div className="iv-actions">
        <button type="button" className="iv-btn" onClick={onTop}>
          <Icon name="chevron-up" size={16} /> {en ? "Back to the top" : "Başa dön"}
        </button>
        {!embed && (
          <>
            <Link className="iv-btn iv-btn--solid" href={startHref}>
              {en ? "Start with this invitation" : "Bu davetiyeyle başla"}
            </Link>
            <Link className="iv-btn" href={exitHref}>
              {en ? "Leave the preview" : "Önizlemeden çık"}
            </Link>
          </>
        )}
      </div>
    </Sec>
  );
}
