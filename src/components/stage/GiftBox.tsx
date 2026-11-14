"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/locale";
import { formatIban } from "@/lib/format";

const SPARKLES = [
  { className: "is-1", style: { top: "8%", left: "14%", fontSize: "5.6cqw" } },
  { className: "is-2", style: { top: "18%", right: "10%", fontSize: "4.1cqw" } },
  { className: "is-3", style: { top: "32%", left: "5%", fontSize: "3.6cqw" } },
  { className: "is-4", style: { top: "26%", right: "5%", fontSize: "3.6cqw" } },
] as const;

const CONFETTI = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"] as const;

const DECORS = [
  { src: "/img/giftbox/mini/dragon_phoenix_v2.webp", className: "is-1", style: { left: "-5.2cqw", top: "2.6cqw", width: "8.8cqw", transform: "rotate(-22deg)" } },
  { src: "/img/giftbox/mini/double_dragon_blue.webp", className: "is-2", style: { left: "43.7cqw", top: "0.5cqw", width: "9.9cqw", transform: "rotate(20deg)" } },
  { src: "/img/giftbox/mini/elegant_leaf_green.webp", className: "is-3", style: { left: "-4.2cqw", top: "31.2cqw", width: "6.8cqw", transform: "rotate(-18deg)" } },
  { src: "/img/giftbox/mini/lien_hoa_v2_green.webp", className: "is-4", style: { left: "47.3cqw", top: "29.6cqw", width: "6.2cqw", transform: "rotate(14deg)" } },
  { src: "/img/giftbox/mini/crystal_floral_red.webp", className: "is-5", style: { left: "-2.1cqw", top: "44.7cqw", width: "11.4cqw", transform: "rotate(8deg)", zIndex: 3 } },
  { src: "/img/giftbox/mini/glass_garden_green.webp", className: "is-6", style: { left: "6.8cqw", top: "47.3cqw", width: "6.8cqw", transform: "rotate(-10deg)", zIndex: 3 } },
  { src: "/img/giftbox/mini/crystal_floral_green.webp", className: "is-7", style: { left: "30.7cqw", top: "45.8cqw", width: "10.4cqw", transform: "rotate(-14deg)", zIndex: 3 } },
] as const;

export default function GiftBox({
  holder,
  iban,
  accent,
  ink,
  label,
  locale,
}: {
  holder: string;
  iban: string;
  accent: string;
  ink: string;
  label: string;
  locale: Locale;
}) {
  const en = locale === "en";
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState(false);
  const [copied, setCopied] = useState(false);
  const pretty = iban.trim() ? formatIban(iban) : "";

  useEffect(() => {
    if (!open) return;
    setHot(false);
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function copyIban() {
    const raw = iban.replace(/\s+/g, "");
    if (!raw) return;
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="stg-gift"
      style={{
        ["--gift-accent" as string]: accent,
        ["--gift-ink" as string]: ink,
        ["--gift-label" as string]: label || ink,
      }}
    >
      <h2 className="stg-gift__title" id={titleId}>{en ? "Gift box" : "Hediye Kutusu"}</h2>
      <button
        type="button"
        className={`stg-gift__hit${open ? " is-open" : ""}${hot && !open ? " is-hot" : ""}`}
        aria-label={en ? "Open the gift box" : "Hediye kutusunu aç"}
        aria-expanded={open}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHot(true);
        }}
        onPointerLeave={() => setHot(false)}
        onPointerDown={() => {
          if (!open) setHot(true);
        }}
        onClick={() => {
          setCopied(false);
          setOpen(true);
        }}
      >
        {SPARKLES.map((spark) => (
          <span key={spark.className} className={`stg-gift__spark ${spark.className}`} style={spark.style} aria-hidden="true">✦</span>
        ))}
        <span className="stg-gift__burst" aria-hidden="true">
          {CONFETTI.map((name) => <i key={name} className={`stg-gift__bit stg-gift__bit--${name}`} />)}
        </span>
        <span className="stg-gift__scene">
          <span className="stg-gift__bob">
            <span className="stg-gift__shadow" />
            {DECORS.map((decor) => (
              <img
                key={decor.className}
                className={`stg-gift__decor ${decor.className}`}
                src={decor.src}
                alt=""
                aria-hidden="true"
                draggable={false}
                decoding="async"
                style={decor.style}
              />
            ))}
            <span className="stg-gift__box">
              <span className="stg-gift__lid">
                <span className="stg-gift__lid-top" />
                <span className="stg-gift__lid-ribbon" />
                <span className="stg-gift__bow" />
              </span>
              <span className="stg-gift__body">
                <span className="stg-gift__band-v" />
                <span className="stg-gift__band-h" />
              </span>
            </span>
          </span>
        </span>
        <span className="stg-gift__hint">{en ? "Tap to open" : "Açmak için dokunun"}</span>
      </button>

      {open ? (
        <div className="stg-gift__sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="stg-gift__sheet-head">
            <p>{en ? "Gift box" : "Hediye Kutusu"}</p>
            <button ref={closeRef} type="button" className="stg-gift__close" onClick={() => setOpen(false)} aria-label={en ? "Close" : "Kapat"}>
              ×
            </button>
          </div>
          <div className="stg-gift__sheet-body">
            <p className="stg-gift__kicker">{en ? "Account holder" : "Hesap sahibi"}</p>
            <p className="stg-gift__name">{holder.trim() || (en ? "Not added yet" : "Henüz eklenmedi")}</p>
            <p className="stg-gift__kicker">IBAN</p>
            <p className="stg-gift__iban">{pretty || (en ? "Not added yet" : "Henüz eklenmedi")}</p>
            <button type="button" className="stg-gift__copy" onClick={copyIban} disabled={!pretty}>
              {copied ? (en ? "Copied" : "Kopyalandı") : (en ? "Copy IBAN" : "IBAN'ı Kopyala")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
