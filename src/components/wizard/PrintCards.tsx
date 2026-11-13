"use client";

import { useLayoutEffect, useRef } from "react";
import Icon from "../Icon";
import { useCatalog } from "@/components/CatalogProvider";
import { ADDONS } from "@/data/pricing";
import { CARD_LOOKS, QR_LOOKS, pickLook, type PrintLook } from "@/data/printCards";
import { CARD_STAGES } from "@/data/cardStages";
import { QR_STAGES } from "@/data/qrStages";
import { localizeAddon } from "@/i18n/product";
import { marketing } from "@/i18n/marketing";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import { formatTL } from "@/lib/format";
import { saveDraft, type InvitationDraft } from "@/lib/storage";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function qrSteps(locale: Locale) {
  return [
    { icon: "print" as const, label: tx(locale, "Bastırın", "Print it") },
    { icon: "pin" as const, label: tx(locale, "Masalara koyun", "Place it on the tables") },
    { icon: "camera" as const, label: tx(locale, "Fotoğraflar size gelsin", "The photographs come to you") },
  ];
}

const LOOK_EN: Record<string, string> = {
  minimal: "Minimal Black and White",
  adacayi: "Sage Garden",
  terrakota: "Terracotta Boho",
  "lacivert-yildiz": "Navy Star",
  allik: "Blush Rose",
  artdeco: "Art Deco Sparkle",
  zumrut: "Emerald Panel",
  renkli: "Colour Steps",
  altin: "Gold Medallion",
  "lacivert-gece": "Navy Night",
  "minimal-zarafet": "Minimal Elegance",
  gul: "Rose Wreath",
  sakura: "Sakura Promise",
  "adacayi-kabartma": "Sage Emboss",
  begonvil: "Bougainvillea Courtyard",
  elhamra: "Alhambra Courtyard",
};

function lookName(look: PrintLook, locale: Locale) {
  if (locale !== "en") return look.name;
  return LOOK_EN[look.id] ?? look.name;
}

const ART_EN: [string, string][] = [
  ["QR kodu okutun, bu güzel günden\nen sevdiğiniz kareleri yükleyin.", "Scan the QR code and upload\nyour favourite frames from this day."],
  ["Telefonunuzun kamerasıyla QR kodu okutun,\nçektiğiniz fotoğrafları bize gönderin.", "Scan the QR code with your phone’s camera\nand send us the photographs you take."],
  ["Kamerayı QR koda tutun; bu güzel günden\nkareleriniz albümümüze eklensin.", "Hold your camera over the QR code, and let\nyour frames from this day join our album."],
  ["QR kodu okutun, gecenin en güzel\nkarelerini bizimle paylaşın.", "Scan the QR code and share\nthe best frames of the night with us."],
  ["Kodu okutun, çektiğiniz fotoğrafları\nuygulama indirmeden bize ulaştırın.", "Scan the code and send us your photographs\nwithout downloading an app."],
  ["Telefonunuzun kamerası yeterli,\nuygulama indirmeniz gerekmez.", "Your phone’s camera is enough.\nThere is no app to download."],
  ["Hayatımızın en güzel gününde\nsizleri de aramızda görmekten\nmutluluk duyarız.", "On the most beautiful day of our lives,\nwe would be happy to have you with us."],
  ["Hayatımızı birleştirdiğimiz bu özel gecede\nyanımızda olmanızı dileriz.", "On this special night, as we join our lives,\nwe hope you will be with us."],
  ["Bu özel günde sizleri de aramızda\ngörmekten mutluluk duyarız.", "We would be happy to have you with us\non this special day."],
  ["Sevgimizi bir yüzükle taçlandıracağımız bu mutlu\ngünde sizleri de aramızda görmek isteriz.", "On this happy day, as we crown our love with a ring,\nwe would love to have you with us."],
  ["Ailelerimizin huzurunda söz yüzüklerimizi\ntakacağımız bu güzel günde yanımızda olun.", "Be with us on this lovely day, as we exchange\npromise rings before our families."],
  ["Ömür boyu sürecek bir yolculuğa\nçıktığımız bu güzel günde sizleri de\naramızda görmekten mutluluk duyarız.", "As we set out on a journey for a lifetime,\nwe would be happy to have you with us\non this lovely day."],
  ["Ailelerimizin huzurunda\nyüzüklerimizi takacağımız\nbu mutlu günde yanımızda olun.", "Be with us on this happy day,\nas we exchange our rings\nbefore our families."],
  ["Hayatımızı birleştireceğimiz bu anlamlı\ngünde nikâh şahidimiz olmanızdan\nonur duyarız.", "On this meaningful day, as we join our lives,\nwe would be honoured to have you\nas a witness to our nikah."],
  ["fotoğrafçısı\nsizsiniz!", "photographer\nis you!"],
  ["Telefonlarımızı", "Our phones"],
  ["FOTOĞRAFA BOĞUN!", "FLOOD US WITH PHOTOS!"],
  ["Anılarımızı", "Our memories"],
  ["BİRLİKTE BİRİKTİRELİM", "LET’S GATHER THEM TOGETHER"],
  ["GÖZÜMÜZDEN KAÇAN", "WHAT WE MISSED"],
  ["anları bize gönderin", "send us the moments"],
  ["Bu geceyi", "This night"],
  ["BİZİM İÇİN ÇEKİN", "CAPTURE IT FOR US"],
  ["Bir kare de sizden", "A frame from you, too"],
  ["FLAŞLAR HAZIR MI?", "FLASHES READY?"],
  ["ANILARIMIZ", "OUR MEMORIES"],
  ["sizin objektifinizden", "through your lens"],
  ["Sizin gözünüzden", "Through your eyes"],
  ["DÜĞÜNÜMÜZ", "OUR WEDDING"],
  ["BUGÜNÜN", "TODAY’S"],
  ["Fotoğraf çekin", "Take a photograph"],
  ["QR kodu okutun", "Scan the QR code"],
  ["Karelerinizi yükleyin", "Upload your frames"],
  ["DÜĞÜNÜMÜZE DAVETLİSİNİZ", "YOU ARE INVITED TO OUR WEDDING"],
  ["SEVGİYLE DAVET EDİYORUZ", "WITH LOVE, WE INVITE YOU"],
  ["EVLENİYORUZ", "WE ARE GETTING MARRIED"],
  ["NİŞANIMIZA DAVETLİSİNİZ", "YOU ARE INVITED TO OUR ENGAGEMENT"],
  ["SÖZ TÖRENİMİZE DAVETLİSİNİZ", "YOU ARE INVITED TO OUR PROMISE CEREMONY"],
  ["NİKÂH DAVETİ", "NIKAH INVITATION"],
  [">TARİH<", ">DATE<"],
  [">SAAT<", ">TIME<"],
  [">MEKÂN<", ">VENUE<"],
  [">ile<", ">and<"],
];

function translateArt(html: string, locale: Locale) {
  if (locale !== "en") return html;
  const pairs = [...ART_EN].sort((a, b) => b[0].length - a[0].length);
  let next = html;
  for (const [tr, en] of pairs) next = next.replaceAll(tr, en);
  return next;
}

export default function PrintCards({ draft }: { draft: InvitationDraft }) {
  const locale = useLocale();
  const copy = marketing(locale);
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
  const when = cardDate(draft.info.date, clock, locale);
  const qrTitle = qr ? localizeAddon(qr, locale).title : tx(locale, "Masa QR Kartı", "Table QR card");

  return (
    <section className="pcards" id="pcards" aria-labelledby="pcards-title">
      <header className="pcards__head">
        <h2 id="pcards-title">{tx(locale, "Baskıya hazır kartlar", "Cards ready to print")}</h2>
        <p>{tx(locale, "Davetiyenizin bilgileriyle kendiliğinden dolar, baskıya hazır gelir.", "They fill in from your invitation and arrive ready to print.")}</p>
      </header>
      <div className="pcards__grid">
        {showQr && qr && (
          <Card
            kind="qr"
            title={qrTitle}
            pitch={tx(locale, "Misafirleriniz QR’ı okutsun, düğününüzün fotoğrafları tek yerde toplansın.", "Guests scan the QR code, and the wedding photographs gather in one place.")}
            badges={[{ label: tx(locale, "Yeni", "New") }, { label: tx(locale, "Çok seçilen", "Popular"), gold: true }]}
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
            addLabel={tx(locale, "Kartı ekle", "Add the card")}
            addPrice={`+${formatTL(qr.price, locale)}`}
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
          title={tx(locale, "Tek sayfalık davetiye kartı", "One-page invitation card")}
          pitch={tx(locale, "Davetiyenizin bilgileriyle hazır gelir; bastırıp elden de dağıtabilirsiniz.", "It arrives ready with your invitation details, so you can print it and hand it out as well.")}
          badges={[{ label: copy.free, free: true }]}
          free
          looks={CARD_LOOKS}
          selected={draft.cardDesign}
          onSelect={(id) => saveDraft({ cardDesign: id })}
          added={draft.printCard}
          onToggle={(on) => saveDraft({ printCard: on })}
          addLabel={tx(locale, "Ekle", "Add")}
          addPrice={copy.free}
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
          <strong>{tx(locale, "Kartlarınız panelinizde sizi bekler", "Your cards wait in your account")}</strong>
          <span>{tx(locale, "Ödeme tamamlandıktan sonra kartlar panelinizde Tasarımlarım bölümünde hazır olur. Metni, renkleri ve tasarımı oradan değiştirebilir, baskıya hazır PDF indirebilirsiniz.", "After payment, the cards are ready under My designs in your account. From there you can change the text, the colours, and the design, and download a print-ready PDF.")}</span>
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
  const locale = useLocale();
  const look = pickLook(looks, selected);
  const headingId = `pcard-${kind}`;
  const name = lookName(look, locale);
  return (
    <article className="pcard" data-kind={kind} data-on={added ? "true" : "false"} aria-labelledby={headingId}>
      <div className="pcard__top">
        <div className="pcard__badges">
          {badges.map((badge) => (
            <span key={badge.label} className={`pcard__badge${badge.gold ? " is-gold" : ""}${badge.free ? " is-free" : ""}`}>{badge.label}</span>
          ))}
        </div>
        <p className="pcard__price">
          {compare != null && <s>{formatTL(compare, locale)}</s>}
          {free ? <b className="is-free">{marketing(locale).free}</b> : <b>{formatTL(price || 0, locale)}</b>}
        </p>
      </div>
      <h3 id={headingId}>{title}</h3>
      <p className="pcard__pitch">{pitch}</p>
      <div className="pcard__stage">
        <div className="pcard__preview" role="img" aria-label={tx(locale, `Önizleme: ${name}`, `Preview: ${name}`)}>
          <Face look={look} kind={kind} bride={bride} groom={groom} when={when} venue={venue} place={place || ""} large />
        </div>
        {steps && (
          <div className="pcard__how">
            <p>{tx(locale, "Nasıl çalışır?", "How does it work?")}</p>
            <ol>
              {qrSteps(locale).map((step) => (
                <li key={step.label}>
                  <span><Icon name={step.icon} size={16} /></span>
                  {step.label}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <p className="pcard__label">{tx(locale, "Tasarım seçin", "Choose a design")}</p>
      <div className="pcard__strip" role="group" aria-label={tx(locale, `${title} tasarımları`, `${title} designs`)}>
        {looks.map((item) => {
          const itemName = lookName(item, locale);
          return (
          <button
            key={item.id}
            type="button"
            className="pcard__swatch"
            aria-pressed={item.id === look.id}
            aria-label={itemName}
            onClick={() => onSelect(item.id)}
          >
            <Face look={item} kind={kind} bride={bride} groom={groom} when={when} venue={venue} place={place || ""} />
            <span>{itemName}</span>
          </button>
          );
        })}
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

function cardDate(date: string, time: string, locale: Locale): CardDate {
  const clock = (time || "19:00").replace(":", ".");
  const tag = locale === "en" ? "en-GB" : "tr-TR";
  if (!date) {
    if (locale === "en") {
      return { dotted: "18 · 09 · 2027", upper: "18 SEPTEMBER 2027", title: "18 September 2027", short: "18.09.2027", day: "SATURDAY", clock, big: "18", month: "SEPTEMBER", year: "2027", weekday: "Saturday" };
    }
    return { dotted: "18 · 09 · 2027", upper: "18 EYLÜL 2027", title: "18 Eylül 2027", short: "18.09.2027", day: "CUMARTESİ", clock, big: "18", month: "EYLÜL", year: "2027", weekday: "Cumartesi" };
  }
  const d = new Date(`${date}T12:00:00`);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const monthName = d.toLocaleDateString(tag, { month: "long" });
  const month = monthName.toLocaleUpperCase(tag);
  const titled = monthName.charAt(0).toLocaleUpperCase(tag) + monthName.slice(1);
  const weekdayRaw = d.toLocaleDateString(tag, { weekday: "long" });
  const day = weekdayRaw.toLocaleUpperCase(tag);
  const weekday = weekdayRaw.charAt(0).toLocaleUpperCase(tag) + weekdayRaw.slice(1);
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
  const locale = useLocale();
  const html = kind === "qr"
    ? fillQrStage(look.id, bride, groom, when, locale)
    : fillCardStage(look.id, bride, groom, when, venue, place, locale);
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

function titleName(value: string, locale: Locale) {
  const tag = locale === "en" ? "en-GB" : "tr";
  return value
    .trim()
    .toLocaleLowerCase(tag)
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase(tag));
}

function fillQrStage(id: string, bride: string, groom: string, when: CardDate, locale: Locale) {
  const raw = translateArt(QR_STAGES[id] || QR_STAGES.minimal, locale);
  const names = `${titleName(bride, locale)} & ${titleName(groom, locale)}`;
  const upper = locale === "en" ? "en-GB" : "tr";
  return raw
    .replaceAll("Elif &amp; Kerem", esc(names))
    .replaceAll("ELİF &amp; KEREM", esc(names.toLocaleUpperCase(upper)))
    .replaceAll("18 · 09 · 2027", esc(when.dotted))
    .replaceAll("18 EYLÜL 2027", esc(when.upper))
    .replaceAll("18 Eylül 2027", esc(when.title))
    .replaceAll("18.09.2027", esc(when.short));
}

function fillCardStage(id: string, bride: string, groom: string, when: CardDate, venue: string, place: string, locale: Locale) {
  const raw = translateArt(CARD_STAGES[id] || CARD_STAGES.altin, locale);
  const first = titleName(bride, locale);
  const second = titleName(groom, locale);
  const upper = locale === "en" ? "en-GB" : "tr";
  const mark = `${first.charAt(0)}&amp;${second.charAt(0)}`;
  const at = locale === "en" ? "AT" : "SAAT";
  const dayLine = `${when.day} · ${at} ${when.clock}`;
  const withWeekday = `${when.title} · ${when.weekday}`;
  const commaWeekday = `${when.title}, ${when.weekday}`;
  const clockLine = `${at} ${when.clock}`;
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
    .replaceAll(">NEHİR<", `>${esc(first.toLocaleUpperCase(upper))}<`)
    .replaceAll(">KAAN<", `>${esc(second.toLocaleUpperCase(upper))}<`)
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
