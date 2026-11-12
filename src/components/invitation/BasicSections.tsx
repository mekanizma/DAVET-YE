"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import Icon from "../Icon";
import { Divider } from "./Decor";
import { useIv } from "./ctx";
import { TR_DAYS, TR_MONTHS, buildIcs, downloadBlob, longDate, pad2 } from "@/lib/format";

/** Section wrapper: full-height page with themed backdrop + "Sayfa geçişi" button. */
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
  return (
    <section id={`iv-${id}`} className="iv-sec" aria-label={title} data-sec={id}>
      <div className={bare ? "iv-sec__bare" : `iv-card ${cardClass}`}>{children}</div>
      {!last && (
        <button
          type="button"
          className="iv-next"
          aria-label="Sayfa geçişi"
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
  return (
    <Sec id="isimler" title="İsimler" bare>
      <p className="iv-lead">{style.lead}</p>
      <h2 className={`iv-names iv-names--${style.nameFont}`}>
        <span>{data.partnerA}</span>
        <span className="iv-names__amp" aria-hidden="true">&amp;</span>
        <span className="sr-only"> ve </span>
        <span>{data.partnerB}</span>
      </h2>
      <p className="iv-date-line">{longDate(data.date)}</p>
      <p className="iv-msg">{data.message}</p>
    </Sec>
  );
}

export function FamiliesSection() {
  const { data, style } = useIv();
  return (
    <Sec id="aileler" title="Aileler">
      <p className="iv-kicker">Ailelerimiz</p>
      <Divider kind={style.ornament} />
      <div className="iv-families">
        <div>
          <h3>Gelinin Ailesi</h3>
          <p>{data.brideFamily}</p>
        </div>
        <div>
          <h3>Damadın Ailesi</h3>
          <p>{data.groomFamily}</p>
        </div>
      </div>
      <p className="iv-msg iv-msg--soft">{data.familyMessage}</p>
    </Sec>
  );
}

function CalendarButton({ label, date, title }: { label: string; date: Date; title: string }) {
  const { data } = useIv();
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
          description: `${data.partnerA} & ${data.partnerB} davetiyesi`,
        });
        downloadBlob("davetiye.ics", new Blob([ics], { type: "text/calendar;charset=utf-8" }));
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      }}
    >
      <Icon name={done ? "check" : "calendar"} size={16} /> {done ? "Takvim dosyası indirildi" : label}
    </button>
  );
}

function DateBlock({ date, caption, label }: { date: Date; caption?: string; label: string }) {
  const { data } = useIv();
  return (
    <div className="iv-dateblock">
      {caption && <p className="iv-dateblock__cap">{caption}</p>}
      <p className="iv-dateblock__day">
        {date.getDate()} {TR_MONTHS[date.getMonth()]} {TR_DAYS[date.getDay()]}
      </p>
      <p className="iv-dateblock__time">
        Saat <strong className="num">{pad2(date.getHours())}:{pad2(date.getMinutes())}</strong>
      </p>
      <CalendarButton label="Takvime Ekle" date={date} title={`${label} — ${data.partnerA} & ${data.partnerB}`} />
    </div>
  );
}

export function DateSection() {
  const { data, style } = useIv();
  return (
    <Sec id="tarih" title="Tarih">
      <p className="iv-kicker">Tarih</p>
      <Divider kind={style.ornament} />
      {data.kinaDate ? (
        <div className="iv-dates">
          <DateBlock date={data.kinaDate} caption="Kına Gecesi" label="Kına Gecesi" />
          <DateBlock date={data.date} caption="Düğün" label="Düğün" />
        </div>
      ) : (
        <DateBlock date={data.date} label="Düğün" />
      )}
    </Sec>
  );
}

export function LocationSection() {
  const { data, style } = useIv();
  const q = encodeURIComponent(`${data.venue} ${data.address}`);
  return (
    <Sec id="konum" title="Konum">
      <p className="iv-kicker">Konum</p>
      <Divider kind={style.ornament} />
      {/* Static, locally drawn map placeholder: no third-party embed or tracking. */}
      <div className="iv-map" role="img" aria-label={`${data.venue} konumu`}>
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
        <Icon name="route" size={16} /> Yol Tarifi
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
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const r = now ? diff(data.date, now) : null;
  const cells: [string, number | null][] = [
    ["Gün", r ? r.d : null],
    ["Saat", r ? r.h : null],
    ["Dakika", r ? r.m : null],
    ["Saniye", r ? r.s : null],
  ];
  return (
    <Sec id="geri-sayim" title="Geri sayım">
      <p className="iv-kicker">Büyük Güne Kalan Zaman</p>
      <Divider kind={style.ornament} />
      <div className="iv-count" role="timer" aria-live="off">
        {cells.map(([label, v]) => (
          <div key={label} className="iv-count__cell">
            <strong className="num">{v === null ? "--" : label === "Gün" ? v : pad2(v)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="iv-date-line">
        {longDate(data.date)} {TR_DAYS[data.date.getDay()]}
      </p>
      {r?.over && <p className="iv-msg">Büyük gün geldi!</p>}
    </Sec>
  );
}

export function ProgramSection() {
  const { data, style } = useIv();
  return (
    <Sec id="program" title="Program akışı">
      <p className="iv-kicker">Program</p>
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
  return (
    <Sec id="kapanis" title="Kapanış" last>
      <p className="iv-kicker">Teşekkürler</p>
      <Divider kind={style.ornament} />
      <p className="iv-msg">{data.closing}</p>
      <p className="iv-signoff">
        {data.partnerA} &amp; {data.partnerB}
      </p>
      <div className="iv-actions">
        <button type="button" className="iv-btn" onClick={onTop}>
          <Icon name="chevron-up" size={16} /> Başa dön
        </button>
        {!embed && (
          <>
            <Link className="iv-btn iv-btn--solid" href={startHref}>
              Bu davetiyeyle başla
            </Link>
            <Link className="iv-btn" href={exitHref}>
              Önizlemeden çık
            </Link>
          </>
        )}
      </div>
    </Sec>
  );
}
