"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/locale";

export type LiveProgramItem = { time: string; title: string; note?: string };

function istanbulParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
}

function toMinutes(time: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((time || "").trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function isLiveEventDay(eventDate: string, now = new Date()) {
  const day = (eventDate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return istanbulParts(now).date === day;
}

export default function LiveDayStrip({
  locale,
  eventDate,
  program,
  liveNote = "",
  className = "",
}: {
  locale: Locale;
  eventDate: string;
  program: LiveProgramItem[];
  liveNote?: string;
  className?: string;
}) {
  const en = locale === "en";
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const live = useMemo(() => {
    void tick;
    if (!isLiveEventDay(eventDate)) return null;
    const { minutes } = istanbulParts();
    const rows = program
      .map((row) => ({ ...row, mins: toMinutes(row.time) }))
      .filter((row) => row.mins != null && (row.title || "").trim()) as Array<LiveProgramItem & { mins: number }>;
    rows.sort((a, b) => a.mins - b.mins);
    let current = rows[0] || null;
    let next: (LiveProgramItem & { mins: number }) | null = null;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].mins <= minutes) current = rows[i];
      if (rows[i].mins > minutes) {
        next = rows[i];
        break;
      }
    }
    return { current, next };
  }, [eventDate, program, tick]);

  if (!live) return null;

  return (
    <aside className={`live-day ${className}`.trim()} role="status" aria-live="polite">
      <p className="live-day__badge">{en ? "Live today" : "Bugün canlı"}</p>
      {liveNote.trim() ? <p className="live-day__note">{liveNote.trim()}</p> : null}
      {live.current ? (
        <p className="live-day__now">
          <strong>{en ? "Now" : "Şimdi"}:</strong> {live.current.time} · {live.current.title}
          {live.current.note ? ` — ${live.current.note}` : ""}
        </p>
      ) : (
        <p className="live-day__now">{en ? "The celebration has begun." : "Kutlama başladı."}</p>
      )}
      {live.next ? (
        <p className="live-day__next">
          <strong>{en ? "Next" : "Sırada"}:</strong> {live.next.time} · {live.next.title}
        </p>
      ) : null}
    </aside>
  );
}
