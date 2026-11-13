"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import Icon from "../Icon";
import type { InvitationStyle } from "@/data/invitationStyles";
import type { OpeningType } from "@/data/themes";
import { useLocale } from "@/i18n/provider";

export type OpeningPhase = "closed" | "opening" | "done";

/**
 * Full-screen cover + opening sequence.
 * Prefer theme `openingVideo` (acilis.mp4) when present — matches the reference.
 * CSS fallbacks cover envelope / door / curtain / seal.
 * Reduced motion: the parent skips straight to "done".
 */
export default function OpeningScreen({
  type,
  phase,
  cover,
  title,
  style,
  initials,
  video,
  onOpen,
  onOpened,
  onSkip,
}: {
  type: OpeningType;
  phase: OpeningPhase;
  cover: string;
  title: string;
  style: InvitationStyle;
  initials: string;
  /** Local path to acilis.mp4 when available */
  video?: string | null;
  onOpen: () => void;
  /** Fired when CSS/video opening finishes */
  onOpened: () => void;
  onSkip: () => void;
}) {
  const locale = useLocale();
  const en = locale === "en";
  const videoRef = useRef<HTMLVideoElement>(null);
  const opening = phase === "opening";
  const useVideo = Boolean(video);
  const split = !useVideo && (type === "door" || type === "curtain");

  useEffect(() => {
    if (phase !== "opening") return;
    if (useVideo) {
      const el = videoRef.current;
      if (!el) return;
      el.currentTime = 0;
      const play = el.play();
      if (play && typeof play.catch === "function") play.catch(() => onOpened());
      return;
    }
    const ms = type === "curtain" ? 1700 : type === "door" || type === "seal" ? 1500 : 1300;
    const t = setTimeout(onOpened, ms);
    return () => clearTimeout(t);
  }, [phase, useVideo, type, onOpened]);

  if (phase === "done") return null;

  return (
    <div
      className={`iv-open iv-open--${type}${opening ? " is-opening" : ""}${useVideo ? " iv-open--video" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-label={en ? `${title} invitation opening` : `${title} davetiyesi açılış ekranı`}
    >
      {useVideo ? (
        <>
          <div className={`iv-open__cover${opening ? " is-away" : ""}`} aria-hidden="true">
            <Image src={cover} alt="" width={640} height={1137} sizes="(max-width:430px) 100vw, 430px" priority />
          </div>
          {opening && (
            <video
              ref={videoRef}
              className="iv-open__video"
              src={video!}
              playsInline
              preload="auto"
              onEnded={onOpened}
              onError={onOpened}
              aria-label={en ? "Opening animation" : "Açılış animasyonu"}
            />
          )}
        </>
      ) : split ? (
        <>
          <div className="iv-open__half iv-open__half--l" aria-hidden="true">
            <Image src={cover} alt="" width={640} height={1137} sizes="(max-width:430px) 200vw, 860px" priority />
          </div>
          <div className="iv-open__half iv-open__half--r" aria-hidden="true">
            <Image src={cover} alt="" width={640} height={1137} sizes="(max-width:430px) 200vw, 860px" priority />
          </div>
        </>
      ) : (
        <div className="iv-open__cover" aria-hidden="true">
          <Image src={cover} alt="" width={640} height={1137} sizes="(max-width:430px) 100vw, 430px" priority />
        </div>
      )}
      <div className="iv-open__shade" aria-hidden="true" />

      <p className="iv-open__pill">{style.pill}</p>

      <div className="iv-open__ctrl">
        {type === "seal" && !useVideo ? (
          <button type="button" className="iv-seal" onClick={onOpen} aria-label={style.openLabel} disabled={opening}>
            <span className="iv-seal__ring" />
            <span className="iv-seal__text">{initials}</span>
          </button>
        ) : (
          <button type="button" className="iv-open__btn" onClick={onOpen} aria-label={style.openLabel} disabled={opening}>
            <Icon name={type === "envelope" || useVideo ? "envelope" : type === "door" ? "lock" : "sparkle"} size={26} />
          </button>
        )}
        <span className="iv-open__hint">{style.openHint}</span>
      </div>

      {opening && (
        <button type="button" className="iv-open__skip" onClick={onSkip}>
          {en ? "Skip" : "Geç"}
        </button>
      )}
    </div>
  );
}
