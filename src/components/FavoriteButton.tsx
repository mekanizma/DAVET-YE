"use client";

import { useLocalJson } from "@/lib/storage";

const EMPTY: string[] = [];

export default function FavoriteButton({ slug, title }: { slug: string; title: string }) {
  const [favs, setFavs] = useLocalJson<string[]>("favorites", EMPTY);
  const on = favs.includes(slug);
  return (
    <button
      type="button"
      className={`fav${on ? " is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? `${title} favorilerden çıkar` : `${title} favorilere ekle`}
      onClick={() => setFavs(on ? favs.filter((s) => s !== slug) : [...favs, slug])}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  );
}
