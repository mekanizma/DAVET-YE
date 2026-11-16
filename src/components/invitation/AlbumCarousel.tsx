"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function AlbumCarousel({
  photos,
  locale = "tr",
  className = "",
}: {
  photos: string[];
  locale?: "tr" | "en";
  className?: string;
}) {
  const en = locale === "en";
  const [index, setIndex] = useState(0);
  const touchX = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex((cur) => (photos.length ? Math.min(cur, photos.length - 1) : 0));
  }, [photos.length]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (photos.length < 2) return;
      setIndex((cur) => (cur + dir + photos.length) % photos.length);
    },
    [photos.length],
  );

  if (!photos.length) return null;

  return (
    <div className={`album-rail ${className}`.trim()}>
      <div
        ref={trackRef}
        className="album-rail__viewport"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX || 0;
        }}
        onTouchEnd={(e) => {
          const x = e.changedTouches[0]?.clientX || touchX.current;
          const dx = x - touchX.current;
          if (Math.abs(dx) < 36) return;
          go(dx < 0 ? 1 : -1);
        }}
      >
        <figure className="album-rail__frame" aria-live="polite">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[index]} alt="" draggable={false} />
          <figcaption className="sr-only">
            {en ? `Photo ${index + 1} of ${photos.length}` : `Fotoğraf ${index + 1} / ${photos.length}`}
          </figcaption>
        </figure>
      </div>

      {photos.length > 1 ? (
        <div className="album-rail__nav">
          <button type="button" className="album-rail__btn" aria-label={en ? "Previous photo" : "Önceki fotoğraf"} onClick={() => go(-1)}>
            ‹
          </button>
          <div className="album-rail__dots" role="tablist" aria-label={en ? "Photos" : "Fotoğraflar"}>
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={i === index ? "is-on" : undefined}
                aria-label={en ? `Photo ${i + 1}` : `Fotoğraf ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button type="button" className="album-rail__btn" aria-label={en ? "Next photo" : "Sonraki fotoğraf"} onClick={() => go(1)}>
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
