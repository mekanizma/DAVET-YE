"use client";

import { useEffect, useState, type ReactNode } from "react";
import Icon, { type IconName } from "../Icon";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import {
  PARTY_HIDDEN_SECTIONS,
  saveDraft,
  type DraftProgramItem,
  type InvitationDraft,
} from "@/lib/storage";
import Time24 from "./Time24";
import type { Errors } from "./validate";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

export default function PartyInfo({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  const locale = useLocale();
  const i = draft.info;
  const [open, setOpen] = useState("davet");

  useEffect(() => {
    const next = [...PARTY_HIDDEN_SECTIONS];
    const cur = draft.hiddenSections;
    const same = next.length === cur.length && next.every((id) => cur.includes(id));
    if (!same) saveDraft({ hiddenSections: next });
  }, [draft.hiddenSections]);

  const set = (key: keyof typeof i) => (value: string) => saveDraft({ info: { ...i, [key]: value } });
  const requiredMiss =
    Number(i.partnerA.trim().length < 2) +
    Number(i.familyNote.trim().length < 2) +
    Number(i.message.trim().length < 2) +
    Number(!i.date) +
    Number(!i.time) +
    Number(i.venue.trim().length < 2) +
    Number(i.address.trim().length < 2) +
    Number(i.closing.trim().length < 7);

  return (
    <div className="info-step pti-form">
      <div className="info-progress" role="status">
        <strong>
          {requiredMiss
            ? tx(locale, `${requiredMiss} zorunlu alan eksik`, `${requiredMiss} required fields left`)
            : tx(locale, "Zorunlu bilgiler tamam.", "The required details are complete.")}
        </strong>
        <p>{tx(locale, "Boş bıraktığınız isteğe bağlı satırlar davetiyede görünmez.", "Optional lines you leave blank stay off the invitation.")}</p>
      </div>

      <Group
        id="davet"
        icon="sparkle"
        title={tx(locale, "Davetiye", "Invitation")}
        open={open === "davet"}
        onOpen={() => setOpen(open === "davet" ? "" : "davet")}
      >
        <Field id="alan-familyNote" label={tx(locale, "Parti adı", "Party name")} required error={errors.familyNote} max={48} value={i.familyNote} onChange={set("familyNote")} placeholder={tx(locale, "Bu Gece Bizim", "Tonight Is Ours")} />
        <Field id="alan-partyKind" label={tx(locale, "Parti türü / tema", "Party type / theme")} optional max={60} value={i.partyKind} onChange={set("partyKind")} placeholder={tx(locale, "Doğum günü · neon gece", "Birthday · neon night")} />
        <Field id="alan-partnerA" label={tx(locale, "Ev sahibi", "Host")} required error={errors.partnerA} max={40} value={i.partnerA} onChange={set("partnerA")} placeholder={tx(locale, "Deniz Yılmaz", "Deniz Yilmaz")} />
        <Field id="alan-partnerB" label={tx(locale, "İkinci ev sahibi", "Second host")} optional error={errors.partnerB} max={40} value={i.partnerB} onChange={set("partnerB")} />
        <Area
          id="alan-message"
          label={tx(locale, "Kısa davet mesajı", "Short invitation message")}
          required
          error={errors.message}
          max={220}
          value={i.message}
          onChange={set("message")}
        />
        <label className="info-field">
          <span>{tx(locale, "Etkinlik tarihi", "Event date")} <i>{tx(locale, "Zorunlu", "Required")}</i></span>
          <input id="alan-date" className="input" type="date" value={i.date} onChange={(e) => set("date")(e.target.value)} aria-invalid={errors.date ? true : undefined} />
          {errors.date && <small className="field__error">{errors.date}</small>}
        </label>
        <label className="info-field">
          <span>{tx(locale, "Başlangıç saati", "Start time")} <i>{tx(locale, "Zorunlu", "Required")}</i></span>
          <Time24 id="alan-time" value={i.time} onChange={set("time")} aria-label={tx(locale, "Başlangıç saati", "Start time")} aria-invalid={Boolean(errors.time)} />
          {errors.time && <small className="field__error">{errors.time}</small>}
        </label>
        <label className="info-field">
          <span>{tx(locale, "Bitiş saati", "End time")} <i>{tx(locale, "İsteğe bağlı", "Optional")}</i></span>
          <Time24 value={i.endTime || ""} onChange={set("endTime")} aria-label={tx(locale, "Bitiş saati", "End time")} optional />
          <small>{tx(locale, "Gece yarısını geçen bitişler ertesi güne yazılır.", "An end time after midnight is treated as the next day.")}</small>
        </label>
      </Group>

      <Group id="mekan" icon="pin" title={tx(locale, "Mekân", "Venue")} open={open === "mekan"} onOpen={() => setOpen(open === "mekan" ? "" : "mekan")}>
        <Field
          id="alan-venue"
          label={tx(locale, "Mekân adı", "Venue name")}
          required
          error={errors.venue}
          max={48}
          value={i.venue}
          onChange={(value) => {
            const next = { ...i, venue: value };
            if (!i.place.trim() || i.place === i.venue) next.place = value;
            saveDraft({ info: next });
          }}
          placeholder="Loft 34"
        />
        <Field id="alan-address" label={tx(locale, "Açık adres", "Full address")} required error={errors.address} max={140} value={i.address} onChange={set("address")} placeholder={tx(locale, "Kemankeş Cad. No: 34, Karaköy", "Karakoy, Istanbul")} />
        <Field label={tx(locale, "Harita bağlantısı", "Map link")} optional value={i.mapUrl} onChange={set("mapUrl")} placeholder="https://maps.google.com/…" />
        <p className="field__hint">{tx(locale, "Bağlantı yoksa harita, mekân adı ve adresten açılır.", "Without a link, the map opens from the venue and address.")}</p>
      </Group>

      <Group id="katilim" icon="check" title={tx(locale, "Katılım", "RSVP")} open={open === "katilim"} onOpen={() => setOpen(open === "katilim" ? "" : "katilim")}>
        <Field id="alan-guestNote" label={tx(locale, "Katılım durumu ve kişi sayısı", "Attendance and guest count")} optional max={80} value={i.guestNote} onChange={set("guestNote")} placeholder={tx(locale, "Kesin katılım · 40 kişi", "Confirmed · 40 guests")} />
        <label className="info-field">
          <span>{tx(locale, "Son katılım bildirim tarihi", "RSVP deadline")} <i>{tx(locale, "İsteğe bağlı", "Optional")}</i></span>
          <input id="alan-kinaDate" className="input" type="date" value={i.kinaDate || ""} onChange={(e) => set("kinaDate")(e.target.value)} />
        </label>
        <Field id="alan-closing" label={tx(locale, "WhatsApp numarası", "WhatsApp number")} required error={errors.closing} max={40} value={i.closing} onChange={set("closing")} placeholder="0532 000 00 00" />
      </Group>

      <Group id="kiyafet" icon="tag" title={tx(locale, "Kıyafet", "Dress code")} open={open === "kiyafet"} onOpen={() => setOpen(open === "kiyafet" ? "" : "kiyafet")}>
        <Field label={tx(locale, "Kıyafet kuralı", "Dress code")} optional max={80} value={i.dressCode} onChange={set("dressCode")} placeholder={tx(locale, "Siyah ve metalik", "Black and metallic")} />
      </Group>

      <Group id="program" icon="sliders" title={tx(locale, "Program", "Program")} open={open === "program"} onOpen={() => setOpen(open === "program" ? "" : "program")}>
        <Program draft={draft} />
      </Group>

      <Group id="menu" icon="doc" title={tx(locale, "Yiyecek ve içecek", "Food and drink")} open={open === "menu"} onOpen={() => setOpen(open === "menu" ? "" : "menu")}>
        <Area label={tx(locale, "İkram", "What’s served")} optional max={400} value={i.menu} onChange={set("menu")} />
      </Group>

      <Group id="notlar" icon="info" title={tx(locale, "Ayrıntılar", "Details")} open={open === "notlar"} onOpen={() => setOpen(open === "notlar" ? "" : "notlar")}>
        <Field label={tx(locale, "Yaş sınırı / çocuk katılımı", "Age limit / children")} optional max={80} value={i.ageNote} onChange={set("ageNote")} placeholder="18+" />
        <Field label={tx(locale, "Ücret / bilet", "Fee / ticket")} optional max={120} value={i.ticketNote} onChange={set("ticketNote")} placeholder={tx(locale, "Ücretsiz", "Free")} />
        <Area label={tx(locale, "Ulaşım ve otopark", "Transport and parking")} optional max={240} value={i.transportNote} onChange={set("transportNote")} />
        <Area label={tx(locale, "Ek notlar", "Extra notes")} optional max={280} value={i.extraNote} onChange={set("extraNote")} />
      </Group>
    </div>
  );
}

function Group({
  id, icon, title, open, onOpen, children,
}: {
  id: string;
  icon: IconName;
  title: string;
  open: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`acc${open ? " is-open" : ""}`} id={id}>
      <div className="acc__bar">
        <button type="button" className="acc__open" onClick={onOpen} aria-expanded={open}>
          <Icon name={icon} size={16} />
          <strong>{title}</strong>
        </button>
      </div>
      {open ? <div className="acc__body">{children}</div> : null}
    </section>
  );
}

function Field({
  id, label, value, onChange, required, optional, error, max, placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  error?: string;
  max?: number;
  placeholder?: string;
}) {
  const locale = useLocale();
  return (
    <label className="info-field">
      <span>
        {label}{" "}
        {required ? <i>{tx(locale, "Zorunlu", "Required")}</i> : null}
        {optional ? <i>{tx(locale, "İsteğe bağlı", "Optional")}</i> : null}
      </span>
      <input id={id} className="input" value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
      {error ? <small className="field__error">{error}</small> : null}
    </label>
  );
}

function Area({
  id, label, value, onChange, required, optional, error, max,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  error?: string;
  max?: number;
}) {
  const locale = useLocale();
  return (
    <label className="info-field">
      <span>
        {label}{" "}
        {required ? <i>{tx(locale, "Zorunlu", "Required")}</i> : null}
        {optional ? <i>{tx(locale, "İsteğe bağlı", "Optional")}</i> : null}
      </span>
      <textarea id={id} className="input" rows={3} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
      {error ? <small className="field__error">{error}</small> : null}
    </label>
  );
}

function Program({ draft }: { draft: InvitationDraft }) {
  const locale = useLocale();
  const program = draft.program?.length ? draft.program : [{ time: "", title: "", note: "" }];
  function setProgram(next: DraftProgramItem[]) {
    saveDraft({ program: next });
  }
  return (
    <div className="wz-program pti-program" id="alan-program">
      <ul className="wz-program__list">
        {program.map((row, index) => (
          <li key={index} className="wz-program__row">
            <Time24 className="input wz-program__time" value={row.time} aria-label={tx(locale, `Saat ${index + 1}`, `Time ${index + 1}`)} onChange={(time) => setProgram(program.map((item, i) => (i === index ? { ...item, time } : item)))} />
            <input className="input wz-program__title" value={row.title} placeholder={tx(locale, "Karşılama", "Welcome")} aria-label={tx(locale, `Başlık ${index + 1}`, `Title ${index + 1}`)} onChange={(e) => setProgram(program.map((item, i) => (i === index ? { ...item, title: e.target.value } : item)))} />
            <input className="input wz-program__note" value={row.note} placeholder={tx(locale, "Kısa not", "Short note")} aria-label={tx(locale, `Not ${index + 1}`, `Note ${index + 1}`)} onChange={(e) => setProgram(program.map((item, i) => (i === index ? { ...item, note: e.target.value } : item)))} />
            <button type="button" className="btn btn--ghost btn--sm" disabled={program.length <= 1} aria-label={tx(locale, "Satırı sil", "Remove row")} onClick={() => setProgram(program.filter((_, i) => i !== index))}>
              <Icon name="close" size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--outline btn--sm" disabled={program.length >= 8} onClick={() => setProgram([...program, { time: "", title: "", note: "" }])}>
        <Icon name="plus" size={14} /> {tx(locale, "Satır ekle", "Add a row")}
      </button>
    </div>
  );
}
