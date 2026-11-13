"use client";

import Image from "next/image";
import type { Newspaper } from "@/data/newspapers";
import { useLocale } from "@/i18n/provider";

/** Kapak: manşet + künye + opsiyonel kapak fotoğrafı */
export default function NewspaperCover({
  paper,
  sizes = "(max-width: 600px) 46vw, 280px",
  priority,
  filter,
  edition = "ÖZEL SAYI",
  kicker,
  slogan,
  dateLabel,
  names,
  coverPhoto,
  coverNote,
  scriptNote,
  inviteNote,
}: {
  paper: Newspaper;
  sizes?: string;
  priority?: boolean;
  filter?: string;
  edition?: string;
  kicker?: string;
  slogan?: string;
  dateLabel?: string;
  names?: string;
  coverPhoto?: string;
  coverNote?: string;
  scriptNote?: string;
  inviteNote?: string;
}) {
  const en = useLocale() === "en";
  const special = en ? "SPECIAL EDITION" : "ÖZEL SAYI";
  const editionLabel = !edition || edition === "ÖZEL SAYI" ? special : edition;
  const topLeft = kicker || special;
  const topRight = editionLabel || dateLabel || "—";
  const coverLabel = en ? `${paper.title} newspaper cover` : `${paper.title} gazete kapağı`;

  if (coverPhoto) {
    return (
      <div
        className="np-css-cover np-css-cover--photo"
        role="img"
        aria-label={coverLabel}
        style={{
          background: paper.paper,
          color: paper.ink,
          filter,
          ["--np-accent" as string]: paper.accent,
        }}
      >
        <div className="np-css-cover__top">
          <span>{topLeft}</span>
          <b>Davetanisi Times</b>
          <span>{topRight}</span>
        </div>
        {slogan ? <p className="np-css-cover__slogan">{slogan}</p> : null}
        <div className="np-css-cover__rule" />
        <p className="np-css-cover__headline">{paper.headline}</p>
        <p className="np-css-cover__tag">{paper.tagline}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="np-css-cover__hero" src={coverPhoto} alt="" />
        {names ? <p className="np-css-cover__names">{names}</p> : null}
        {coverNote ? <p className="np-css-cover__note">{coverNote}</p> : null}
        <div className="np-css-cover__foot">
          {scriptNote ? <span className="np-css-cover__script">{scriptNote}</span> : null}
          {inviteNote ? <span className="np-css-cover__invite">{inviteNote}</span> : null}
        </div>
      </div>
    );
  }

  if (paper.cover && !coverNote && !scriptNote && !inviteNote && !kicker && !slogan) {
    return (
      <Image
        src={paper.cover}
        alt={paper.title}
        width={640}
        height={905}
        sizes={sizes}
        priority={priority}
        className="np-cover-img"
        style={filter ? { filter } : undefined}
      />
    );
  }

  // Editable typographic cover when user filled masthead fields
  if (paper.cover && (coverNote || scriptNote || inviteNote || kicker || slogan || names)) {
    return (
      <div className="np-cover-stack" style={filter ? { filter } : undefined}>
        <Image
          src={paper.cover}
          alt={paper.title}
          width={640}
          height={905}
          sizes={sizes}
          priority={priority}
          className="np-cover-img"
        />
        <div className="np-cover-stack__overlay" aria-hidden="true">
          {names ? <p>{names}</p> : null}
          {coverNote ? <p>{coverNote}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className="np-css-cover"
      role="img"
      aria-label={coverLabel}
      style={{
        background: paper.paper,
        color: paper.ink,
        filter,
        ["--np-accent" as string]: paper.accent,
      }}
    >
      <div className="np-css-cover__top">
        <span>{topLeft}</span>
        <b>Davetanisi Times</b>
        <span>{topRight}</span>
      </div>
      {slogan ? <p className="np-css-cover__slogan">{slogan}</p> : null}
      <div className="np-css-cover__rule" />
      <p className="np-css-cover__headline">{paper.headline}</p>
      <p className="np-css-cover__tag">{paper.tagline}</p>
      <div className="np-css-cover__photos">
        <span style={{ gridArea: "a" }} />
        <span style={{ gridArea: "b" }} />
        <span style={{ gridArea: "c" }} />
        <span style={{ gridArea: "d" }} />
      </div>
      {names ? <p className="np-css-cover__names">{names}</p> : null}
      {coverNote ? <p className="np-css-cover__note">{coverNote}</p> : null}
      <div className="np-css-cover__foot">
        {scriptNote ? <span className="np-css-cover__script">{scriptNote}</span> : null}
        {inviteNote ? <span className="np-css-cover__invite">{inviteNote}</span> : null}
      </div>
    </div>
  );
}
