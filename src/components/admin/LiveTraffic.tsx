"use client";

import { useEffect, useState } from "react";
import { adminSend } from "./AdminShell";
import type { TrafficSummary } from "@/lib/trafficTypes";

function dayLabel(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
}

function deltaText(today: number, yesterday: number) {
  if (yesterday <= 0) return today > 0 ? "Düne göre yeni" : "Dünle aynı";
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  if (pct === 0) return "Dünle aynı";
  if (pct > 0) return `Düne göre +${pct}%`;
  return `Düne göre ${pct}%`;
}

export default function LiveTraffic() {
  const [data, setData] = useState<TrafficSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    const pull = () => {
      adminSend<TrafficSummary>("/api/yonetim/trafik", { fresh: true })
        .then((next) => {
          if (stop) return;
          setData(next);
          setError("");
        })
        .catch((err: Error) => {
          if (!stop) setError(err.message || "Trafik okunamadı");
        });
    };
    pull();
    const timer = window.setInterval(pull, 45_000);
    window.addEventListener("focus", pull);
    return () => {
      stop = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", pull);
    };
  }, []);

  if (error && !data) return <p className="alert alert--error" role="alert">{error}</p>;
  if (!data) {
    return (
      <section className="adm-card traffic">
        <h2>Canlı ziyaretçiler</h2>
        <p className="muted" role="status">Gerçek zamanlı sayılar yükleniyor…</p>
      </section>
    );
  }

  const maxBar = Math.max(1, ...data.last7Days.map((d) => d.visitors));

  return (
    <section className="adm-card traffic" aria-live="polite">
      <div className="traffic__head">
        <div>
          <h2>Canlı ziyaretçiler</h2>
          <p className="muted">Sitedeki gerçek girişler · 15 sn’de bir yenilenir</p>
        </div>
        <div className="traffic__live">
          <span className="traffic__pulse" aria-hidden />
          <div>
            <strong>{data.liveNow}</strong>
            <span>şu an geziniyor</span>
          </div>
        </div>
      </div>

      <div className="adm-stats traffic__stats">
        <article className="adm-stat adm-stat--ok">
          <span>Bugün tekil ziyaretçi</span>
          <strong>{data.todayVisitors}</strong>
          <small>{deltaText(data.todayVisitors, data.yesterdayVisitors)}</small>
        </article>
        <article className="adm-stat">
          <span>Bugün oturum</span>
          <strong>{data.todaySessions}</strong>
          <small>Ayrı tarayıcı oturumu</small>
        </article>
        <article className="adm-stat">
          <span>Sayfa görüntüleme</span>
          <strong>{data.todayPageviews}</strong>
          <small>Bugün açılan sayfalar</small>
        </article>
        <article className="adm-stat">
          <span>Tıklama</span>
          <strong>{data.todayClicks}</strong>
          <small>Buton / link tıklaması</small>
        </article>
        <article className="adm-stat">
          <span>Gezinen</span>
          <strong>{data.todayEngaged}</strong>
          <small>Kaydıran veya 12 sn kalan</small>
        </article>
        <article className="adm-stat">
          <span>Cihaz (bugün)</span>
          <strong>{data.devices.mobile + data.devices.desktop + data.devices.other}</strong>
          <small>
            {data.devices.mobile} mobil · {data.devices.desktop} masaüstü
          </small>
        </article>
      </div>

      <div className="traffic__grid">
        <div className="traffic__panel">
          <h3>Son 7 gün</h3>
          <ul className="traffic__bars" aria-label="Son 7 gün ziyaretçi">
            {data.last7Days.map((row) => (
              <li key={row.day}>
                <span className="traffic__bars-label">{dayLabel(row.day)}</span>
                <span className="traffic__bars-track" aria-hidden>
                  <span style={{ width: `${Math.max(6, (row.visitors / maxBar) * 100)}%` }} />
                </span>
                <span className="traffic__bars-val num">{row.visitors}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="traffic__panel">
          <h3>Bugün en çok bakılan</h3>
          {data.topPaths.length === 0 ? (
            <p className="muted">Henüz sayfa kaydı yok. Site ziyaret edilince burada görünür.</p>
          ) : (
            <ul className="traffic__paths">
              {data.topPaths.map((row) => (
                <li key={row.path}>
                  <code>{row.path}</code>
                  <span className="num">{row.views}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
