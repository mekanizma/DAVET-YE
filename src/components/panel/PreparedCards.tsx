"use client";

import { useEffect, useState } from "react";
import Icon from "../Icon";
import { PreparedCardFace } from "@/components/wizard/PrintCards";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import { downloadBlob } from "@/lib/format";
import { useDraft } from "@/lib/storage";
import type { UserPrintCard } from "@/lib/userCards";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function useShareQr(url: string) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!url) return;
    let stop = false;
    import("qrcode")
      .then((mod) => mod.toDataURL(url, {
        margin: 1,
        width: 640,
        errorCorrectionLevel: "M",
        color: { dark: "#1a1a1a", light: "#ffffff" },
      }))
      .then((data) => {
        if (!stop) setSrc(data);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [url]);
  return src;
}

function applyDraft(card: UserPrintCard, draft: ReturnType<typeof useDraft>["draft"]): UserPrintCard {
  if (draft.order?.code !== card.code) return card;
  return {
    ...card,
    qr: card.qr || draft.addons.includes("masa-qr"),
    card: card.card || draft.printCard,
    qrDesign: draft.qrDesign || card.qrDesign,
    cardDesign: draft.cardDesign || card.cardDesign,
    bride: card.bride || draft.info.partnerA,
    groom: card.groom || draft.info.partnerB,
    date: card.date || draft.info.date,
    time: card.time || draft.info.time,
    venue: card.venue || draft.info.venue || draft.info.place,
    place: card.place || draft.info.address,
  };
}

export default function PreparedCards() {
  const locale = useLocale();
  const { draft, ready } = useDraft();
  const [cards, setCards] = useState<UserPrintCard[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    fetch("/api/hesap/kartlar")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "");
        return data.cards as UserPrintCard[];
      })
      .then((rows) => {
        if (!stop) setCards(Array.isArray(rows) ? rows : []);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message || tx(locale, "Kartlar açılamadı.", "The cards could not be opened."));
      });
    return () => {
      stop = true;
    };
  }, [locale]);

  if (!ready || (!cards && !error)) return <p className="wz-loading" role="status">{tx(locale, "Yükleniyor…", "Loading…")}</p>;
  const rows = (cards || []).map((card) => applyDraft(card, draft)).filter((card) => card.qr || card.card);

  return (
    <section className="dash__card" id="kartlar" aria-labelledby="d-cards">
      <h2 id="d-cards">{tx(locale, "Baskı kartları", "Print cards")}</h2>
      <p className="muted">
        {tx(
          locale,
          "QR kartı ve tek sayfalık davetiye, ödeme onaylandıktan sonra buradan açılır ve indirilir.",
          "The QR card and the one-page invitation open here, and can be downloaded once the payment is confirmed.",
        )}
      </p>
      {error ? <p className="iv-status iv-status--err" role="alert">{error}</p> : null}
      {rows.length === 0 && !error ? (
        <p>{tx(locale, "Henüz hazır kart yok. Davetiyeyi oluştururken QR kartını veya tek sayfalık davetiyeyi eklediğinizde burada görünür.", "No cards yet. They appear here when you add a QR card or a one-page invitation while making the design.")}</p>
      ) : null}
      <div className="cardshelf">
        {rows.map((card) => (
          <article key={card.code} className="cardshelf__order">
            <header>
              <strong>{card.title}</strong>
              <span className="num">{card.code}</span>
            </header>
            {card.qr ? <CardTile card={card} kind="qr" locale={locale} /> : null}
            {card.card ? <CardTile card={card} kind="card" locale={locale} /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function CardTile({ card, kind, locale }: { card: UserPrintCard; kind: "qr" | "card"; locale: Locale }) {
  const qrSrc = useShareQr(kind === "qr" ? card.shareUrl : "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const title = kind === "qr" ? tx(locale, "QR kartı", "QR card") : tx(locale, "Tek sayfalık davetiye", "One-page invitation");
  const file = `${card.code}-${kind === "qr" ? "qr" : "davetiye"}.png`;
  const qrPending = kind === "qr" && Boolean(card.shareUrl) && !qrSrc;

  function shotFrom(from: HTMLElement | null) {
    return from?.closest(".cardshelf__item")?.querySelector(".cardshelf__shot .pthumb") as HTMLElement | null;
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("is-locked");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("is-locked");
    };
  }, [open]);

  async function download(node: HTMLElement | null) {
    if (!node || !card.ready) return;
    setBusy(true);
    setNote("");
    try {
      const { toPng } = await import("html-to-image");
      const data = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(data)).blob();
      downloadBlob(file, blob);
      setNote(tx(locale, "İndirildi.", "Downloaded."));
    } catch {
      setNote(tx(locale, "Görsel kaydedilemedi. Tarayıcının yazdır menüsünden PDF olarak kaydedebilirsiniz.", "The image could not be saved. Use the browser print menu to save a PDF."));
    } finally {
      setBusy(false);
    }
  }

  const face = (
    <PreparedCardFace
      kind={kind}
      design={kind === "qr" ? card.qrDesign : card.cardDesign}
      bride={card.bride}
      groom={card.groom}
      date={card.date}
      time={card.time}
      venue={card.venue}
      place={card.place}
      qrSrc={qrSrc}
    />
  );

  return (
    <div className="cardshelf__item">
      <p className="cardshelf__label">{title}</p>
      <div className="cardshelf__preview">{face}</div>
      <div className="cardshelf__actions">
        <button type="button" className="btn btn--outline btn--lg" onClick={() => setOpen(true)}>
          {tx(locale, "Görüntüle", "View")}
        </button>
        <button type="button" className="btn btn--dark btn--lg" disabled={!card.ready || busy || qrPending} onClick={(event) => download(shotFrom(event.currentTarget))}>
          <Icon name="download" size={16} /> {card.ready ? tx(locale, "İndir", "Download") : tx(locale, "Ödeme sonrası", "After payment")}
        </button>
      </div>
      {note ? <p className="cardshelf__note" role="status">{note}</p> : null}
      <div className="cardshelf__shot" aria-hidden="true">{face}</div>
      {open ? (
        <div className="card-view" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" className="card-view__backdrop" aria-label={tx(locale, "Kapat", "Close")} onClick={() => setOpen(false)} />
          <div className="card-view__sheet">
            <div className="card-view__frame">{face}</div>
            <div className="card-view__actions">
              <button type="button" className="btn btn--dark btn--lg" disabled={!card.ready || busy || qrPending} onClick={(event) => download(shotFrom(event.currentTarget))}>
                <Icon name="download" size={16} /> {card.ready ? tx(locale, "İndir", "Download") : tx(locale, "Ödeme sonrası", "After payment")}
              </button>
              <button type="button" className="btn btn--outline btn--lg" onClick={() => setOpen(false)}>{tx(locale, "Kapat", "Close")}</button>
            </div>
            {!card.ready ? <p className="muted">{tx(locale, "Ödeme onaylanınca indirebilirsiniz.", "You can download it once the payment is confirmed.")}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
