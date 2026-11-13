"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Icon from "./Icon";
import NewspaperCover from "./NewspaperCover";
import { newspaperStyles, NEWSPAPER_STYLES, type Newspaper, type NewspaperStyleId } from "@/data/newspapers";
import { sampleFor } from "@/data/sample";
import { useLocale } from "@/i18n/provider";
import { longDate } from "@/lib/format";
import { DEFAULT_PROGRAM, DEFAULT_TIMELINE } from "@/lib/newspaperDraft";
import type { NewspaperProgramItem, NewspaperTimelineItem } from "@/lib/storage";

export interface FlipInfo {
  headline?: string;
  tagline?: string;
  edition?: string;
  kicker?: string;
  slogan?: string;
  coverNote?: string;
  scriptNote?: string;
  inviteNote?: string;
  names?: string;
  familyA?: string;
  familyB?: string;
  date?: string;
  time?: string;
  venue?: string;
  address?: string;
  story?: string;
  storySpot?: string;
  quote?: string;
  thanks?: string;
  thanksTitle?: string;
  closing?: string;
  timeline?: NewspaperTimelineItem[];
  program?: NewspaperProgramItem[];
  photos?: { cover?: string; collage?: string[] };
  size?: "A3" | "A2";
  style?: NewspaperStyleId;
}

const DEFAULT_STORY =
  "Yolumuz bir kahve kuyruğunda kesişti. Önce sohbet ettik, sonra saatlerce konuştuk, derken bir daha hiç ayrılmadık. Bugün, bu sayfaları sizinle paylaşmaktan büyük mutluluk duyuyoruz. Hikâyemizin bu bölümünü sevdiklerimizle birlikte yazmak istiyoruz. Düğün gününe giden yolda bizi hiç yalnız bırakmayan ailelerimize ve dostlarımıza teşekkür ederiz. Sizleri bu mutlu günde aramızda görmek, bizim için hayatın en güzel hediyesi olacak.";

const STORY_EN =
  "Our paths crossed in a coffee queue. We talked, then we talked for hours, and after that we never really parted. Today we are glad to share these pages with you. We want to write this chapter with the people we love. Thank you to our families and friends, who never left us alone on the way to the wedding. Having you with us on this happy day will be the finest gift of our lives.";

const TIMELINE_EN = [
  { title: "First meeting", text: "It all began with a hello." },
  { title: "First date", text: "A long walk by the shore." },
  { title: "The proposal", text: "It did not take long to say yes." },
  { title: "The big day", text: "Together we turn a new page." },
];

const PROGRAM_EN = [
  { time: "19:00", title: "Welcome" },
  { time: "20:00", title: "Wedding ceremony" },
  { time: "20:45", title: "Dinner" },
  { time: "22:00", title: "Cake & dancing" },
];

export default function NewspaperFlip({
  paper,
  info,
  embed = false,
  backHref,
}: {
  paper: Newspaper;
  info?: FlipInfo;
  embed?: boolean;
  backHref?: string;
}) {
  const locale = useLocale();
  const en = locale === "en";
  const sample = sampleFor(locale);
  const names = info?.names?.trim() || `${sample.partnerA} & ${sample.partnerB}`;
  const venue = info?.venue?.trim() || sample.venue;
  const address = info?.address?.trim() || sample.address;
  const story = info?.story?.trim() || (en ? STORY_EN : DEFAULT_STORY);
  const headline = info?.headline?.trim() || paper.headline;
  const tagline = info?.tagline?.trim() || paper.tagline;
  const edition = info?.edition?.trim() || (en ? "SPECIAL EDITION" : "ÖZEL SAYI");
  const kicker = info?.kicker?.trim() || "";
  const slogan = info?.slogan?.trim() || "";
  const coverNote = info?.coverNote?.trim() || "";
  const scriptNote = info?.scriptNote?.trim() || "";
  const inviteNote = info?.inviteNote?.trim() || "";
  const storySpot = info?.storySpot?.trim() || (en ? "HOW IT BEGAN" : "NASIL BAŞLADI?");
  const quote = info?.quote?.trim() || (en ? "Love is looking the same way, together." : "Sevgi, birlikte aynı yöne bakmaktır.");
  const thanks = info?.thanks?.trim() || (en ? "Thank you for sharing this day with us." : "Bu günü bizimle paylaştığınız için teşekkür ederiz.");
  const thanksTitle = info?.thanksTitle?.trim() || (en ? "THANK YOU" : "TEŞEKKÜR EDERİZ");
  const closing = info?.closing?.trim() || (en ? "WITH LOVE," : "SEVGİYLE,");
  const time = info?.time?.trim() || sample.time;
  const familyA = info?.familyA?.trim() || "";
  const familyB = info?.familyB?.trim() || "";
  const timeline = (info?.timeline?.length ? info.timeline : en ? TIMELINE_EN : DEFAULT_TIMELINE).filter((t) => t.title || t.text);
  const program = (info?.program?.length ? info.program : en ? PROGRAM_EN : DEFAULT_PROGRAM).filter((p) => p.title || p.time);
  const collage = info?.photos?.collage || [];
  const coverPhoto = info?.photos?.cover || "";

  const dateText = useMemo(() => {
    const raw = info?.date || sample.date;
    const [y, m, d] = raw.split("-").map(Number);
    if (!y || !m || !d) return "";
    return longDate(new Date(y, m - 1, d), locale);
  }, [info?.date, locale, sample.date]);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState<"A3" | "A2">(info?.size || "A3");
  const [styleId, setStyleId] = useState<NewspaperStyleId>(info?.style || "original");
  const filter = NEWSPAPER_STYLES.find((s) => s.id === styleId)?.filter ?? "none";
  const startX = useRef<number | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (info?.size) setSize(info.size);
  }, [info?.size]);
  useEffect(() => {
    if (info?.style) setStyleId(info.style);
  }, [info?.style]);

  const sheets = [
    {
      id: "kapak",
      label: en ? "Cover" : "Kapak",
      node: (
        <NewspaperCover
          paper={{ ...paper, headline, tagline }}
          sizes="(max-width: 600px) 94vw, 560px"
          priority
          filter={filter}
          edition={edition}
          kicker={kicker}
          slogan={slogan}
          dateLabel={dateText}
          names={names}
          coverPhoto={coverPhoto}
          coverNote={coverNote}
          scriptNote={scriptNote}
          inviteNote={inviteNote}
        />
      ),
      cover: true,
    },
    {
      id: "hikaye",
      label: en ? "Story" : "Hikâye",
      node: (
        <Sheet paper={paper} no={2} section={en ? "Story" : "Hikâye"} filter={filter} edition={edition} kicker={kicker || (en ? "ON THE SAME PATH" : "AYNI YOLDA")} slogan={slogan}>
          <h2 className="np-sheet__h">{storySpot}</h2>
          <p className="np-sheet__by">{names}</p>
          {(familyA || familyB) && (
            <p className="np-sheet__by">{[familyA, familyB].filter(Boolean).join(" · ")}</p>
          )}
          <p className="np-sheet__cols">{story}</p>
          {quote ? <blockquote className="np-sheet__quote">“{quote}”</blockquote> : null}
          <h2 className="np-sheet__h" style={{ marginTop: "4cqw" }}>
            {en ? "Timeline" : "Kronoloji"}
          </h2>
          <ol className="np-sheet__timeline">
            {timeline.map((item, i) => (
              <li key={i}>
                <b>{item.title || (en ? `Item ${i + 1}` : `Madde ${i + 1}`)}</b>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
        </Sheet>
      ),
    },
    {
      id: "kolaj",
      label: en ? "Frames" : "Kareler",
      node: (
        <Sheet paper={paper} no={3} section={en ? "Frames" : "Kareler"} filter={filter} edition={edition} kicker={kicker || (en ? "BEAUTIFUL MEMORIES" : "GÜZEL ANILAR")} slogan={slogan}>
          <h2 className="np-sheet__h">{en ? "The best frames" : "En güzel kareler"}</h2>
          <div className="np-sheet__photos" role="img" aria-label={en ? "Photo collage" : "Fotoğraf kolajı"}>
            {[0, 1, 2, 3, 4].map((n) => {
              const src = collage[n];
              return (
                <figure key={n} style={{ gridArea: `p${n + 1}` }}>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="np-sheet__photo-img" />
                  ) : (
                    <span aria-hidden="true">{en ? `Frame ${n + 1}` : `Kare ${n + 1}`}</span>
                  )}
                </figure>
              );
            })}
          </div>
          <p className="np-sheet__caption">
            {collage.some(Boolean)
              ? en
                ? "Your collage page."
                : "Kolaj sayfanız."
              : en
                ? "Add photos from the Frames page."
                : "Kareler sayfasından fotoğraf ekleyin."}
          </p>
        </Sheet>
      ),
    },
    {
      id: "tesekkur",
      label: en ? "Thanks" : "Teşekkür",
      node: (
        <Sheet paper={paper} no={4} section={en ? "Thanks" : "Teşekkür"} filter={filter} edition={edition} kicker={kicker || (en ? "WITH THANKS" : "TEŞEKKÜRLE")} slogan={slogan}>
          <h2 className="np-sheet__h">{thanksTitle}</h2>
          <p className="np-sheet__cols">{thanks}</p>
          <dl className="np-sheet__facts">
            <div>
              <dt>{en ? "When" : "Ne zaman"}</dt>
              <dd>
                {dateText}
                {time ? `, ${time}` : ""}
              </dd>
            </div>
            <div>
              <dt>{en ? "Where" : "Nerede"}</dt>
              <dd>
                {venue}
                {address ? ` — ${address}` : ""}
              </dd>
            </div>
            {program.length ? (
              <div>
                <dt>{en ? "Programme" : "Program"}</dt>
                <dd>{program.map((p) => `${p.time} ${p.title}`.trim()).join(" · ")}</dd>
              </div>
            ) : null}
          </dl>
          <p className="np-sheet__thanks">
            {closing} {names}
          </p>
        </Sheet>
      ),
    },
  ];
  const n = sheets.length;

  const go = useCallback((to: number) => setPage(Math.max(0, Math.min(n - 1, to))), [n]);

  useEffect(() => {
    viewRef.current?.focus({ preventScroll: true });
  }, []);

  function onKey(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      go(page + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      go(page - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(n - 1);
    }
  }
  function onDown(e: PointerEvent) {
    startX.current = e.clientX;
  }
  function onUp(e: PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (dx < -40) go(page + 1);
    else if (dx > 40) go(page - 1);
  }

  return (
    <div className={`flip${embed ? " flip--embed" : ""}`} data-size={size}>
      <style>{`@media print{@page{size:${size};margin:0}}`}</style>

      <header className="flip__bar">
        {backHref ? (
          <Link href={backHref} className="flip__back" aria-label={en ? "Go back" : "Geri dön"}>
            <Icon name="chevron-left" size={18} /> <span className="flip__back-text">{en ? "Back" : "Geri"}</span>
          </Link>
        ) : (
          <span />
        )}
        <p className="flip__title">{paper.title}</p>
        <span className="flip__mark" aria-hidden="true">
          {en ? "PREVIEW" : "ÖNİZLEME"}
        </span>
      </header>

      <div
        ref={viewRef}
        className="flip__view"
        tabIndex={0}
        role="group"
        aria-roledescription={en ? "newspaper" : "gazete"}
        aria-label={
          en
            ? `${paper.title}, ${n} pages. Use the arrow keys to turn the page.`
            : `${paper.title}, ${n} sayfa. Sayfa çevirmek için ok tuşlarını kullanın.`
        }
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (startX.current = null)}
      >
        <div className="flip__book">
          {sheets.map((s, i) => {
            const flipped = i < page;
            return (
              <div
                key={s.id}
                className={`flip__leaf${flipped ? " is-flipped" : ""}${i === page ? " is-current" : ""}`}
                style={{ zIndex: n - i }}
                aria-hidden={i !== page}
                inert={i !== page ? true : undefined}
                data-print-page={i + 1}
              >
                {s.node}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flip__controls">
        <button type="button" className="flip__btn" onClick={() => go(page - 1)} disabled={page === 0} aria-label={en ? "Previous page" : "Önceki sayfa"}>
          <Icon name="chevron-left" size={20} />
        </button>
        <p className="flip__count" aria-live="polite">
          <span className="num">{page + 1}</span> / <span className="num">{n}</span>
          <span className="flip__label"> · {sheets[page].label}</span>
        </p>
        <button
          type="button"
          className="flip__btn"
          onClick={() => go(page + 1)}
          disabled={page === n - 1}
          aria-label={en ? "Next page" : "Sonraki sayfa"}
        >
          <Icon name="chevron-right" size={20} />
        </button>
      </div>

      <div className="flip__tools">
        <label className="flip__tool">
          <span>{en ? "Look" : "Görünüm"}</span>
          <select value={styleId} onChange={(e) => setStyleId(e.target.value as NewspaperStyleId)}>
            {newspaperStyles(locale).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flip__tool">
          <span>{en ? "Print size" : "Baskı boyutu"}</span>
          <select value={size} onChange={(e) => setSize(e.target.value as "A3" | "A2")}>
            <option value="A3">A3</option>
            <option value="A2">A2</option>
          </select>
        </label>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => window.print()}>
          <Icon name="print" size={14} /> {en ? `Print (${size})` : `Yazdır (${size})`}
        </button>
      </div>
      <p className="flip__hint">
        {en
          ? "When you print, every page is printed in order. The preview updates with what you entered."
          : "Yazdırırken tüm sayfalar sırayla basılır. Önizleme girdiğiniz içerikle güncellenir."}
      </p>
    </div>
  );
}

function Sheet({
  paper,
  no,
  section,
  filter,
  edition,
  kicker,
  slogan,
  children,
}: {
  paper: Newspaper;
  no: number;
  section: string;
  filter: string;
  edition?: string;
  kicker?: string;
  slogan?: string;
  children: React.ReactNode;
}) {
  const en = useLocale() === "en";
  return (
    <article
      className="np-sheet"
      style={{ background: paper.paper, color: paper.ink, filter, ["--np-accent" as string]: paper.accent }}
    >
      <div className="np-sheet__top">
        <span>{(kicker || section).toUpperCase()}</span>
        <b>Davetanisi Times</b>
        <span>{edition || (en ? `PAGE ${no}` : `SAYFA ${no}`)}</span>
      </div>
      {slogan ? <p className="np-sheet__slogan">{slogan}</p> : null}
      <div className="np-sheet__rule" />
      <div className="np-sheet__body">{children}</div>
    </article>
  );
}
