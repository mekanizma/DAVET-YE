"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";

type Props = {
  src: string | null;
  /** When this becomes true, music starts (call from the open-tap gesture). */
  play: boolean;
  volume?: number;
  loop?: boolean;
  /** Compact floating control (invitation / party / baby). */
  floating?: boolean;
  className?: string;
  labelOn?: string;
  labelOff?: string;
};

/**
 * Invitation background music. Starts when `play` flips true (usually the
 * envelope / gate tap — a user gesture so browsers allow audio).
 */
export default function InviteMusic({
  src,
  play,
  volume = 0.6,
  loop = true,
  floating = false,
  className,
  labelOn = "Müziği kapat",
  labelOff = "Müziği aç",
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    started.current = false;
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setOn(false);
  }, [src]);

  const start = useCallback(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    a.volume = volume;
    const run = a.play();
    if (run && typeof run.then === "function") {
      run.then(() => {
        started.current = true;
        setOn(true);
      }).catch(() => setOn(false));
    } else {
      started.current = true;
      setOn(true);
    }
  }, [src, volume]);

  useEffect(() => {
    if (!play || !src || started.current) return;
    start();
  }, [play, src, start]);

  // Browsers may block the first autoplay; retry on the next tap.
  useEffect(() => {
    if (!play || !src || on) return;
    const retry = () => start();
    window.addEventListener("pointerdown", retry, { once: true });
    return () => window.removeEventListener("pointerdown", retry);
  }, [play, src, on, start]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !src) return;
    if (on) {
      a.pause();
      setOn(false);
      return;
    }
    start();
  };

  if (!src) return null;

  return (
    <>
      <audio ref={audioRef} src={src} loop={loop} preload="auto" playsInline />
      <button
        type="button"
        className={className || (floating ? "invite-music" : undefined)}
        aria-pressed={on}
        aria-label={on ? labelOn : labelOff}
        title={on ? labelOn : labelOff}
        onClick={toggle}
      >
        <Icon name={on ? "music" : "music-off"} size={floating ? 18 : 16} />
      </button>
    </>
  );
}
