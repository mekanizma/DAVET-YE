"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "../Icon";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import { longDate } from "@/lib/format";

type Summary = {
  rsvpTotal: number;
  attending: number;
  declining: number;
  guests: number;
  children: number;
  wishes: number;
  photos: number;
  lens: number;
  wall: number;
};

type RsvpRow = {
  id: string;
  name: string;
  attending: boolean;
  count: number;
  children: number;
  meal: string;
  transfer: string;
  note: string;
  createdAt: string;
  title?: string;
};

type WishRow = { id: string; name: string; text: string; createdAt: string; title?: string };
type PhotoRow = { id: string; title: string; source: string; createdAt: string; url: string };

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

export default function GuestBoard() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [wishes, setWishes] = useState<WishRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);

  useEffect(() => {
    let stop = false;
    fetch("/api/hesap/misafir")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Misafir panosu okunamadı.");
        return data as { summary: Summary; rsvps: RsvpRow[]; wishes: WishRow[]; recentPhotos: PhotoRow[] };
      })
      .then((data) => {
        if (stop) return;
        setSummary(data.summary);
        setRsvps(data.rsvps || []);
        setWishes(data.wishes || []);
        setPhotos(data.recentPhotos || []);
        setError("");
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message || tx(locale, "Misafir panosu okunamadı.", "Could not load the guest board."));
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [locale]);

  if (loading) return <p className="wz-loading" role="status">{tx(locale, "Yükleniyor…", "Loading…")}</p>;
  if (error) {
    return (
      <div className="dash">
        <header className="dash__head">
          <h1>{tx(locale, "Misafir panosu", "Guest board")}</h1>
        </header>
        <p className="field__error" role="alert">{error}</p>
      </div>
    );
  }

  const s = summary || {
    rsvpTotal: 0,
    attending: 0,
    declining: 0,
    guests: 0,
    children: 0,
    wishes: 0,
    photos: 0,
    lens: 0,
    wall: 0,
  };

  return (
    <div className="dash guest-board">
      <header className="dash__head">
        <div>
          <p className="eyebrow">{tx(locale, "Panel", "Account")}</p>
          <h1>{tx(locale, "Misafir panosu", "Guest board")}</h1>
          <p className="dash__mail">{tx(locale, "Katılım, dilek ve fotoğraflar burada toplanır.", "RSVPs, wishes and photos gather here.")}</p>
        </div>
      </header>

      <div className="desk-tiles">
        <div className="desk-tile">
          <Icon name="heart" size={18} />
          <strong>{s.attending}</strong>
          <span>{tx(locale, `katılıyor · ${s.guests} kişi`, `attending · ${s.guests} guests`)}</span>
        </div>
        <div className="desk-tile">
          <Icon name="user" size={18} />
          <strong>{s.children}</strong>
          <span>{tx(locale, "çocuk", "children")}</span>
        </div>
        <div className="desk-tile">
          <Icon name="sparkle" size={18} />
          <strong>{s.wishes}</strong>
          <span>{tx(locale, "dilek", "wishes")}</span>
        </div>
        <div className="desk-tile">
          <Icon name="image" size={18} />
          <strong>{s.photos}</strong>
          <span>{tx(locale, `${s.wall} duvar · ${s.lens} çekim`, `${s.wall} wall · ${s.lens} lens`)}</span>
        </div>
      </div>

      <section className="dash__card" aria-labelledby="gb-rsvp">
        <div className="dash__row">
          <h2 id="gb-rsvp">{tx(locale, "Katılım yanıtları", "RSVPs")}</h2>
          <span className="num">{s.rsvpTotal}</span>
        </div>
        {rsvps.length === 0 ? (
          <p>{tx(locale, "Henüz katılım yanıtı yok. Canlı davetiyedeki form doldurulunca burada görünür.", "No RSVPs yet. Replies from the live invitation appear here.")}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{tx(locale, "Ad Soyad", "Full name")}</th>
                  <th scope="col">{tx(locale, "Yanıt", "Reply")}</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">
                      {row.name}
                      <small className="num" style={{ display: "block" }}>{row.title || ""} · {longDate(new Date(row.createdAt), locale)}</small>
                    </th>
                    <td>{row.attending ? tx(locale, "Evet", "Yes") : tx(locale, "Hayır", "No")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dash__card" aria-labelledby="gb-wishes">
        <h2 id="gb-wishes">{tx(locale, "Dilekler", "Wishes")}</h2>
        {wishes.length === 0 ? (
          <p>{tx(locale, "Henüz dilek yok.", "No wishes yet.")}</p>
        ) : (
          <ul className="dash__list">
            {wishes.map((wish) => (
              <li key={wish.id}>
                <div>
                  <strong>{wish.name}</strong>
                  <p>{wish.text}</p>
                  <small className="num">{wish.title || ""} · {longDate(new Date(wish.createdAt), locale)}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dash__card" aria-labelledby="gb-photos">
        <div className="dash__row">
          <h2 id="gb-photos">{tx(locale, "Son fotoğraflar", "Latest photos")}</h2>
          <Link href="/panel/album" className="btn btn--outline btn--sm">{tx(locale, "Albüme git", "Open album")}</Link>
        </div>
        {photos.length === 0 ? (
          <p>{tx(locale, "Henüz fotoğraf yok.", "No photos yet.")}</p>
        ) : (
          <ul className="guest-board__photos">
            {photos.map((photo) => (
              <li key={photo.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" />
                <span>{photo.source === "lens" ? tx(locale, "Çekim", "Lens") : tx(locale, "Duvar", "Wall")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
