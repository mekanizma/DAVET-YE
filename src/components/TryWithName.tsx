"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import Icon from "./Icon";
import { coverOf, type Theme } from "@/data/themes";
import { localizeTheme } from "@/i18n/catalog";
import { useLocale } from "@/i18n/provider";
import { applyTryInvite, previewTryUrl } from "@/lib/tryInvite";

type Props = {
  themes: Theme[];
  /** Pre-select a theme (theme detail / product card). */
  initialSlug?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function TryWithName({ themes, initialSlug = "", className, children }: Props) {
  const locale = useLocale();
  const en = locale === "en";
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(initialSlug || themes[0]?.slug || "");
  const [partnerA, setPartnerA] = useState("");
  const [partnerB, setPartnerB] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const list = useMemo(() => themes.map((t) => localizeTheme(t, locale)), [themes, locale]);
  const selected = list.find((t) => t.slug === slug) || list[0];

  useEffect(() => {
    if (initialSlug) setSlug(initialSlug);
  }, [initialSlug]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const a = partnerA.trim();
    const b = partnerB.trim();
    if (a.length < 2 || b.length < 2) {
      setError(en ? "Enter both names." : "Lütfen iki ismi de yazın.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError(en ? "Pick a date." : "Lütfen bir tarih seçin.");
      return;
    }
    setBusy(true);
    setError("");
    const saved = applyTryInvite({
      slug: selected.slug,
      partnerA: a,
      partnerB: b,
      date,
      locale,
    });
    if (!saved) {
      setBusy(false);
      setError(en ? "Could not start the preview." : "Önizleme başlatılamadı.");
      return;
    }
    window.location.assign(previewTryUrl(selected.slug, locale));
  }

  const labels = selected?.eventTypes.includes("bebek")
    ? {
        a: en ? "Expectant mother" : "Anne adayı",
        b: en ? "Expectant father" : "Baba adayı",
      }
    : selected?.eventTypes.includes("parti")
      ? {
          a: en ? "Host name" : "Ev sahibi",
          b: en ? "Guest of honour" : "Onur konuğu",
        }
      : {
          a: en ? "First name" : "Birinci isim",
          b: en ? "Second name" : "İkinci isim",
        };

  return (
    <>
      <button
        type="button"
        className={className || "btn btn--dark btn--lg"}
        onClick={() => setOpen(true)}
        data-track="try-with-name"
      >
        {children || (
          <>
            <Icon name="sparkle" size={16} /> {en ? "Try with your name" : "Kendi isminle dene"}
          </>
        )}
      </button>

      {open ? (
        <div className="try-modal" role="presentation" onClick={() => setOpen(false)}>
          <div
            ref={panelRef}
            className="try-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="try-modal__head">
              <div>
                <p className="eyebrow">{en ? "Live preview" : "Canlı önizleme"}</p>
                <h2 id={titleId}>{en ? "Try with your own name" : "Kendi isminle dene"}</h2>
                <p className="muted">
                  {en
                    ? "No account needed for the first try. Watch the animation open with your names."
                    : "İlk deneme için hesap istemiyoruz. Animasyon sizin isimlerinizle açılsın."}
                </p>
              </div>
              <button type="button" className="try-modal__close" aria-label={en ? "Close" : "Kapat"} onClick={() => setOpen(false)}>
                <Icon name="close" size={18} />
              </button>
            </header>

            <form className="try-modal__form" onSubmit={onSubmit} noValidate>
              {!initialSlug && list.length > 1 ? (
                <fieldset className="try-modal__themes">
                  <legend>{en ? "Choose an invitation" : "Bir davetiye seçin"}</legend>
                  <div className="try-modal__rail" role="listbox" aria-label={en ? "Invitations" : "Davetiyeler"}>
                    {list.map((t) => {
                      const on = t.slug === selected?.slug;
                      return (
                        <button
                          key={t.slug}
                          type="button"
                          role="option"
                          aria-selected={on}
                          className={on ? "try-pick is-on" : "try-pick"}
                          onClick={() => setSlug(t.slug)}
                        >
                          <Image src={coverOf(t)} alt="" width={120} height={214} sizes="88px" />
                          <span>{t.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : selected ? (
                <p className="try-modal__chosen">
                  <strong>{selected.title}</strong>
                  <span className="muted"> · {selected.price} TL</span>
                </p>
              ) : null}

              <div className="try-modal__fields">
                <label className="field">
                  <span>{labels.a}</span>
                  <input
                    value={partnerA}
                    onChange={(e) => setPartnerA(e.target.value)}
                    autoComplete="given-name"
                    required
                    maxLength={60}
                    placeholder={en ? "Elif" : "Elif"}
                  />
                </label>
                <label className="field">
                  <span>{labels.b}</span>
                  <input
                    value={partnerB}
                    onChange={(e) => setPartnerB(e.target.value)}
                    autoComplete="family-name"
                    required
                    maxLength={60}
                    placeholder={en ? "Can" : "Can"}
                  />
                </label>
                <label className="field">
                  <span>{en ? "Event date" : "Etkinlik tarihi"}</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </label>
              </div>

              {error ? (
                <p className="alert alert--error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn btn--dark btn--lg btn--block btn--serif" disabled={busy || !selected} aria-busy={busy}>
                {busy
                  ? en
                    ? "Opening…"
                    : "Açılıyor…"
                  : en
                    ? "Open the animation"
                    : "Animasyonu aç"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
