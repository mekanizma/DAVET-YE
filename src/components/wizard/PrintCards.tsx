"use client";

import { useLayoutEffect, useRef } from "react";
import Icon from "../Icon";
import { useCatalog } from "@/components/CatalogProvider";
import { ADDONS } from "@/data/pricing";
import { CARD_LOOKS, QR_LOOKS, pickLook, type PrintLook } from "@/data/printCards";
import { CARD_STAGES } from "@/data/cardStages";
import { QR_STAGES } from "@/data/qrStages";
import { formatTL } from "@/lib/format";
import { saveDraft, type InvitationDraft } from "@/lib/storage";

const QR_STEPS = [
  { icon: "print" as const, label: "Bastırın" },
  { icon: "pin" as const, label: "Masalara koyun" },
  { icon: "camera" as const, label: "Fotoğraflar size gelsin" },
];

export default function PrintCards({ draft }: { draft: InvitationDraft }) {
  const cat = useCatalog();
  const listed = cat.addons.find((item) => item.id === "masa-qr");
  const fallback = ADDONS.find((item) => item.id === "masa-qr");
  const qr = listed ?? fallback;
  const showQr = Boolean(qr && listed?.active !== false);
  const bride = draft.info.partnerA.trim() || "Elif";
  const groom = draft.info.partnerB.trim() || "Kerem";
  const clock = (draft.info.time || "").trim();
  const venue = (draft.info.venue || draft.info.place || "").trim();
  const place = draft.info.address.trim();
  const when = cardDate(draft.info.date, clock);

  return (
    <section className="pcards" id="pcards" aria-labelledby="pcards-title">
      <header className="pcards__head">
        <h2 id="pcards-title">Baskıya hazır kartlar</h2>
        <p>Davetiyenizin bilgileriyle kendiliğinden dolar, baskıya hazır gelir.</p>
      </header>
      <div className="pcards__grid">
        {showQr && qr && (
          <Card
            kind="qr"
            title="Masa QR Kartı"
            pitch="Misafirleriniz QR’ı okutsun, düğününüzün fotoğrafları tek yerde toplansın."
            badges={[{ label: "Yeni" }, { label: "Çok seçilen", gold: true }]}
            price={qr.price}
            compare={(qr.was != null && qr.was > qr.price) ? qr.was : qr.was == null ? 99 : undefined}
            looks={QR_LOOKS}
            selected={draft.qrDesign}
            onSelect={(id) => saveDraft({ qrDesign: id })}
            added={draft.addons.includes(qr.id)}
            onToggle={(on) => {
              const addons = on ? [...new Set([...draft.addons, qr.id])] : draft.addons.filter((id) => id !== qr.id);
              saveDraft({ addons });
            }}
            addLabel="Kartı ekle"
            addPrice={`+${formatTL(qr.price)}`}
            bride={bride}
            groom={groom}
            when={when}
            venue={venue}
            place={place}
            steps
          />
        )}
        <Card
          kind="card"
          title="Tek sayfalık davetiye kartı"
          pitch="Davetiyenizin bilgileriyle hazır gelir; bastırıp elden de dağıtabilirsiniz."
          badges={[{ label: "Ücretsiz", free: true }]}
          free
          looks={CARD_LOOKS}
          selected={draft.cardDesign}
          onSelect={(id) => saveDraft({ cardDesign: id })}
          added={draft.printCard}
          onToggle={(on) => saveDraft({ printCard: on })}
          addLabel="Ekle"
          addPrice="Ücretsiz"
          bride={bride}
          groom={groom}
          when={when}
          venue={venue}
          place={place}
        />
      </div>
      <aside className="pcards__note">
        <Icon name="info" size={22} />
        <div>
          <strong>Kartlarınız panelinizde sizi bekler</strong>
          <span>Ödeme tamamlandıktan sonra kartlar panelinizde Tasarımlarım bölümünde hazır olur. Metni, renkleri ve tasarımı oradan değiştirebilir, baskıya hazır PDF indirebilirsiniz.</span>
        </div>
      </aside>
    </section>
  );
}

function Card({
  kind, title, pitch, badges, price, compare, free, looks, selected, onSelect, added, onToggle, addLabel, addPrice, bride, groom, when, venue, place, steps,
}: {
  kind: "qr" | "card";
  title: string;
  pitch: string;
  badges: { label: string; gold?: boolean; free?: boolean }[];
  price?: number;
  compare?: number;
  free?: boolean;
  looks: PrintLook[];
  selected: string;
  onSelect: (id: string) => void;
  added: boolean;
  onToggle: (on: boolean) => void;
  addLabel: string;
  addPrice: string;
  bride: string;
  groom: string;
  when: CardDate;
  venue: string;
  place?: string;
  steps?: boolean;
}) {
  const look = pickLook(looks, selected);
  const headingId = `pcard-${kind}`;
  return (
    <article className="pcard" data-kind={kind} data-on={added ? "true" : "false"} aria-labelledby={headingId}>
      <div className="pcard__top">
        <div className="pcard__badges">
          {badges.map((badge) => (
            <span key={badge.label} className={`pcard__badge${badge.gold ? " is-gold" : ""}${badge.free ? " is-free" : ""}`}>{badge.label}</span>
          ))}
        </div>
        <p className="pcard__price">
          {compare != null && <s>{formatTL(compare)}</s>}
          {free ? <b className="is-free">Ücretsiz</b> : <b>{formatTL(price || 0)}</b>}
        </p>
      </div>
      <h3 id={headingId}>{title}</h3>
      <p className="pcard__pitch">{pitch}</p>
      <div className="pcard__stage">
        <div className="pcard__preview" role="img" aria-label={`Önizleme: ${look.name}`}>
          <Face look={look} kind={kind} bride={bride} groom={groom} when={when} venue={venue} place={place || ""} large />
        </div>
        {steps && (
          <div className="pcard__how">
            <p>Nasıl çalışır?</p>
            <ol>
              {QR_STEPS.map((step) => (
                <li key={step.label}>
                  <span><Icon name={step.icon} size={16} /></span>
                  {step.label}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <p className="pcard__label">Tasarım seçin</p>
      <div className="pcard__strip" role="group" aria-label={`${title} tasarımları`}>
        {looks.map((item) => (
          <button
            key={item.id}
            type="button"
            className="pcard__swatch"
            aria-pressed={item.id === look.id}
            aria-label={item.name}
            onClick={() => onSelect(item.id)}
          >
            <Face look={item} kind={kind} bride={bride} groom={groom} when={when} venue={venue} place={place || ""} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
      <label className="pcard__add">
        <input type="checkbox" checked={added} onChange={(event) => onToggle(event.target.checked)} />
        <span className="pcard__box" aria-hidden="true"><Icon name="check" size={16} /></span>
        <span className="pcard__add-text"><strong>{addLabel}</strong><b className={free ? "is-free" : "num"}>{addPrice}</b></span>
      </label>
    </article>
  );
}

interface CardDate {
  dotted: string;
  upper: string;
  title: string;
  short: string;
  day: string;
  clock: string;
  big: string;
  month: string;
  year: string;
  /** Weekday in sentence case, e.g. Cumartesi. */
  weekday: string;
}

function cardDate(date: string, time: string): CardDate {
  const clock = (time || "19:00").replace(":", ".");
  if (!date) {
    return { dotted: "18 · 09 · 2027", upper: "18 EYLÜL 2027", title: "18 Eylül 2027", short: "18.09.2027", day: "CUMARTESİ", clock, big: "18", month: "EYLÜL", year: "2027", weekday: "Cumartesi" };
  }
  const d = new Date(`${date}T12:00:00`);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const monthName = d.toLocaleDateString("tr-TR", { month: "long" });
  const month = monthName.toLocaleUpperCase("tr");
  const titled = monthName.charAt(0).toLocaleUpperCase("tr") + monthName.slice(1);
  const weekdayName = d.toLocaleDateString("tr-TR", { weekday: "long" });
  const day = weekdayName.toLocaleUpperCase("tr");
  const weekday = weekdayName.charAt(0).toLocaleUpperCase("tr") + weekdayName.slice(1);
  return {
    dotted: `${dd} · ${mm} · ${d.getFullYear()}`,
    upper: `${d.getDate()} ${month} ${d.getFullYear()}`,
    title: `${d.getDate()} ${titled} ${d.getFullYear()}`,
    short: `${dd}.${mm}.${d.getFullYear()}`,
    day,
    clock,
    big: String(d.getDate()),
    month,
    year: String(d.getFullYear()),
    weekday,
  };
}

function Face({
  look, kind, bride, groom, when, venue, place, large,
}: {
  look: PrintLook;
  kind: "qr" | "card";
  bride: string;
  groom: string;
  when: CardDate;
  venue: string;
  place: string;
  large?: boolean;
}) {
  const html = kind === "qr"
    ? fillQrStage(look.id, bride, groom, when)
    : fillCardStage(look.id, bride, groom, when, venue, place);
  return (
    <div
      className={`pthumb${large ? " is-lg" : ""}`}
      data-look={look.id}
      data-kind={kind}
      style={{ aspectRatio: look.ratio, backgroundColor: look.paper, color: look.ink, ["--accent" as string]: look.accent }}
    >
      <QrLive html={html} />
    </div>
  );
}

function titleName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("tr"));
}

function fillQrStage(id: string, bride: string, groom: string, when: CardDate) {
  const raw = QR_STAGES[id] || QR_STAGES.minimal;
  const names = `${titleName(bride)} & ${titleName(groom)}`;
  return raw
    .replaceAll("Elif &amp; Kerem", esc(names))
    .replaceAll("ELİF &amp; KEREM", esc(names.toLocaleUpperCase("tr")))
    .replaceAll("18 · 09 · 2027", esc(when.dotted))
    .replaceAll("18 EYLÜL 2027", esc(when.upper))
    .replaceAll("18 Eylül 2027", esc(when.title))
    .replaceAll("18.09.2027", esc(when.short));
}

function fillCardStage(id: string, bride: string, groom: string, when: CardDate, venue: string, place: string) {
  const raw = CARD_STAGES[id] || CARD_STAGES.altin;
  const first = titleName(bride);
  const second = titleName(groom);
  const mark = `${first.charAt(0)}&amp;${second.charAt(0)}`;
  const dayLine = `${when.day} · SAAT ${when.clock}`;
  const withWeekday = `${when.title} · ${when.weekday}`;
  const commaWeekday = `${when.title}, ${when.weekday}`;
  const clockLine = `SAAT ${when.clock}`;
  let html = raw
    .replaceAll(">E&amp;K<", `>${mark}<`)
    .replaceAll(">N&amp;K<", `>${mark}<`)
    .replaceAll(">Elif<", `>${esc(first)}<`)
    .replaceAll(">Kerem<", `>${esc(second)}<`)
    .replaceAll(">Zeynep<", `>${esc(first)}<`)
    .replaceAll(">Emre<", `>${esc(second)}<`)
    .replaceAll(">Defne<", `>${esc(first)}<`)
    .replaceAll(">Arda<", `>${esc(second)}<`)
    .replaceAll(">Ece<", `>${esc(first)}<`)
    .replaceAll(">Burak<", `>${esc(second)}<`)
    .replaceAll(">Selin<", `>${esc(first)}<`)
    .replaceAll(">Mert<", `>${esc(second)}<`)
    .replaceAll(">Ada<", `>${esc(first)}<`)
    .replaceAll(">Barış<", `>${esc(second)}<`)
    .replaceAll(">Leyla<", `>${esc(first)}<`)
    .replaceAll(">Tarık<", `>${esc(second)}<`)
    .replaceAll(">NEHİR<", `>${esc(first.toLocaleUpperCase("tr"))}<`)
    .replaceAll(">KAAN<", `>${esc(second.toLocaleUpperCase("tr"))}<`)
    .replaceAll("11 EYLÜL 2027", esc(when.upper))
    .replaceAll("15 MAYIS 2027", esc(when.upper))
    .replaceAll("5 Haziran 2027", esc(when.title))
    .replaceAll("18 · 09 · 2027", esc(when.dotted))
    .replaceAll("19 Haziran 2027 · Cumartesi", esc(withWeekday))
    .replaceAll("25 Nisan 2027 · Pazar", esc(withWeekday))
    .replaceAll("18 Haziran 2027, Cuma", esc(commaWeekday))
    .replaceAll("CUMARTESİ · SAAT 19.00", esc(dayLine))
    .replaceAll("CUMARTESİ · SAAT 18.00", esc(dayLine))
    .replaceAll("CUMARTESİ · SAAT 19.30", esc(dayLine))
    .replaceAll("CUMARTESİ · SAAT 17.00", esc(dayLine))
    .replaceAll("SAAT 17.00", esc(clockLine))
    .replaceAll("SAAT 15.00", esc(clockLine))
    .replaceAll("SAAT 20.00", esc(clockLine))
    .replaceAll(">18.30<", `>${esc(when.clock)}<`)
    .replaceAll(">CUMARTESİ<", `>${esc(when.day)}<`)
    .replaceAll(">16<", `>${esc(when.big)}<`)
    .replaceAll("EKİM 2027", esc(`${when.month} ${when.year}`))
    .replaceAll("LCV · 0532 123 45 67", "")
    .replaceAll("LCV · 0533 412 76 30", "")
    .replaceAll("LCV · 0542 318 90 27", "")
    .replaceAll("LCV · 0532 774 15 08", "");
  if (venue) {
    const line = esc(venue);
    html = html
      .replaceAll("Çırağan Sarayı Kempinski", line)
      .replaceAll("Four Seasons Bosphorus", line)
      .replaceAll("Sait Halim Paşa Yalısı", line)
      .replaceAll("Feriye Lokantası", line)
      .replaceAll("Emirgan Korusu, Pembe Köşk", line)
      .replaceAll("Ankara Palas", line)
      .replaceAll("Kuum Hotel Bahçe", line)
      .replaceAll("Swissôtel Büyük Efes", line);
    const city = place && place !== venue ? esc(place) : "";
    html = html
      .replaceAll("Beşiktaş, İstanbul", city)
      .replaceAll("BEŞİKTAŞ, İSTANBUL", city)
      .replaceAll("Yeniköy, İstanbul", city)
      .replaceAll("Ortaköy, İstanbul", city)
      .replaceAll("SARIYER, İSTANBUL", city)
      .replaceAll("Ulus, Ankara", city)
      .replaceAll("YALIKAVAK, BODRUM", city)
      .replaceAll("Alsancak, İzmir", city);
  }
  return html;
}

function fitsBox(text: HTMLElement) {
  return text.scrollHeight <= text.clientHeight + 2 && text.scrollWidth <= text.clientWidth + 2;
}

function fitQrText(root: HTMLElement) {
  for (const text of root.querySelectorAll<HTMLElement>(".stg-text[data-fit='shrink']")) {
    if (!text.dataset.authoredFit) {
      text.dataset.authoredFit = text.style.getPropertyValue("--fit") || "1";
    }
    const min = Number(text.dataset.fitMin || 0.5);
    const cap = Number(text.dataset.authoredFit) || 1;
    text.style.setProperty("--fit", String(cap));
    if (fitsBox(text)) continue;
    let lo = min;
    let hi = cap;
    let best = min;
    for (let step = 0; step < 8; step += 1) {
      const mid = (lo + hi) / 2;
      text.style.setProperty("--fit", mid.toFixed(3));
      if (fitsBox(text)) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    text.style.setProperty("--fit", best.toFixed(3));
  }
}

function QrLive({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const fit = () => fitQrText(root);
    fit();
    document.fonts.addEventListener("loadingdone", fit);
    document.fonts.ready.then(fit);
    return () => document.fonts.removeEventListener("loadingdone", fit);
  }, [html]);
  return <div ref={ref} className="qr-live" dangerouslySetInnerHTML={{ __html: html }} />;
}

function esc(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
