"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon, { type IconName } from "../Icon";
import PrintCards from "./PrintCards";
import { useCatalog } from "@/components/CatalogProvider";
import { formatIban, formatTL } from "@/lib/format";
import { saveDraft, type DraftInfo, type DraftProgramItem, type InvitationDraft } from "@/lib/storage";
import { RSVP_FORM_ENABLED } from "@/data/sections";
import { INFO_FIELDS, type Errors } from "./validate";

const DEFAULT_OFF = ["hikaye", "kiyafet", "album", "menu", "ani-duvari", "ani-cekimi"];

const TRACKS = [
  { id: "seremoni", label: "Düğün Seremoni Fon Müziği" },
  { id: "fon", label: "Düğün Fon Müziği" },
  { id: "fon-2", label: "Düğün Fon Müziği 2" },
  { id: "sinematik", label: "Sinematik Düğün Müziği" },
  { id: "davet", label: "Düğün Davetiye Müziği" },
  { id: "caz", label: "Düğün Caz Müziği" },
  { id: "gece", label: "Gece Ruhu Düğün Müziği" },
];

function on(draft: InvitationDraft, id: string) {
  return !draft.hiddenSections.includes(id);
}

export default function StepInfo({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  const cat = useCatalog();
  const i = draft.info;
  const [open, setOpen] = useState("isimler");
  const aimed = useRef("");
  const wall = cat.addons.find((a) => a.id === "ani-duvari");
  const lens = cat.addons.find((a) => a.id === "ani-cekimi");

  useEffect(() => {
    if (draft.hiddenSections.length) return;
    if (i.partnerA.trim() || i.venue.trim()) return;
    saveDraft({ hiddenSections: DEFAULT_OFF });
  }, [draft.hiddenSections.length, i.partnerA, i.venue]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("alan") || "";
    const group = INFO_FIELDS[id]?.group;
    if (!id || !group || aimed.current === id) return;
    if (draft.hiddenSections.includes(group)) {
      if (aimed.current !== `show:${id}`) {
        aimed.current = `show:${id}`;
        saveDraft({ hiddenSections: draft.hiddenSections.filter((section) => section !== group) });
      }
      return;
    }
    setOpen(group);
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const el = document.getElementById(`alan-${id}`);
      if (!el) {
        if (tries > 20) window.clearInterval(timer);
        return;
      }
      window.clearInterval(timer);
      if (aimed.current === id) return;
      aimed.current = id;
      el.scrollIntoView({ behavior: "instant", block: "center" });
      const input = el.matches("input, textarea, select") ? el : el.querySelector("input, textarea, select");
      if (input instanceof HTMLElement) input.focus({ preventScroll: true });
    }, 50);
    return () => window.clearInterval(timer);
  }, [draft.hiddenSections]);

  const set = (k: keyof DraftInfo) => (v: string) => saveDraft({ info: { ...i, [k]: v } });
  function toggle(id: string, next: boolean) {
    const hidden = new Set(draft.hiddenSections);
    if (next) hidden.delete(id);
    else hidden.add(id);
    saveDraft({ hiddenSections: [...hidden] });
    if (next) setOpen(id);
  }
  function toggleAddon(id: string, next: boolean) {
    const s = new Set(draft.addons);
    if (next) s.add(id);
    else s.delete(id);
    saveDraft({ addons: [...s] });
  }

  const groups = countGroups(draft);

  return (
    <div className="info-step">
      <div className="info-progress" role="status">
        <strong>{groups.done} / {groups.total} bölüm tamam</strong>
        <p>{groups.missing ? `Ödemeden önce ${groups.missing} eksik bilgi tamamlanmalı.` : "Zorunlu bilgiler tamam."}</p>
        <progress value={groups.done} max={groups.total} aria-label={`${groups.done} / ${groups.total} bölüm tamam`} />
      </div>

      <Group
        id="isimler"
        icon="user"
        title="İsimler"
        meta="4 alan"
        missing={missingOf(errors, ["partnerA", "partnerB", "date"])}
        open={open === "isimler"}
        enabled
        locked
        onOpen={() => setOpen(open === "isimler" ? "" : "isimler")}
        onToggle={() => {}}
      >
        <Field id="alan-partnerA" label="Gelinin adı" required error={errors.partnerA} max={24} value={i.partnerA} onChange={set("partnerA")} placeholder="Ayşe" />
        <Field id="alan-partnerB" label="Damadın adı" required error={errors.partnerB} max={24} value={i.partnerB} onChange={set("partnerB")} placeholder="Mehmet" />
        <label className="info-field">
          <span>Etkinlik tarihi ve saati <i>Zorunlu</i></span>
          <span className="info-field__row">
            <input id="alan-date" className="input" type="date" value={i.date} onChange={(e) => set("date")(e.target.value)} aria-invalid={errors.date ? true : undefined} />
            <input id="alan-time" className="input" type="time" value={i.time} onChange={(e) => set("time")(e.target.value)} aria-label="Etkinlik saati" aria-invalid={errors.time ? true : undefined} />
          </span>
          {errors.date && <small className="field__error">{errors.date}</small>}
          {errors.time && <small className="field__error">{errors.time}</small>}
        </label>
        {draft.event === "coklu" && (
          <label className="info-field">
            <span>Kına tarihi ve saati <i>Zorunlu</i></span>
            <span className="info-field__row">
              <input id="alan-kinaDate" className="input" type="date" value={i.kinaDate} onChange={(e) => set("kinaDate")(e.target.value)} aria-invalid={errors.kinaDate ? true : undefined} />
              <input className="input" type="time" value={i.kinaTime} onChange={(e) => set("kinaTime")(e.target.value)} aria-label="Kına saati" />
            </span>
            {errors.kinaDate && <small className="field__error">{errors.kinaDate}</small>}
          </label>
        )}
        <label className="info-field">
          <span>Bitiş saati (isteğe bağlı)</span>
          <input className="input" type="time" value={i.endTime} onChange={(e) => set("endTime")(e.target.value)} />
          <small>Girerseniz saat aralık olarak görünür (ör. 19:00–23:00).</small>
        </label>
        <Area label="Davet metni" optional max={100} value={i.message} onChange={set("message")} hint="Kısa bir cümle en iyi sonucu verir." />
      </Group>

      <Group id="aileler" icon="home" title="Aileler" meta="3 alan" missing={missingOf(errors, ["brideFamily", "groomFamily"])} open={open === "aileler"} enabled={on(draft, "aileler")} onOpen={() => setOpen(open === "aileler" ? "" : "aileler")} onToggle={(v) => toggle("aileler", v)}>
        <Area id="alan-brideFamily" label="Gelinin ailesi" required error={errors.brideFamily} max={60} value={i.brideFamily} onChange={set("brideFamily")} hint="İki satır en iyi sonucu verir: adlar, alt satırda soyadı." />
        <Area id="alan-groomFamily" label="Damadın ailesi" required error={errors.groomFamily} max={60} value={i.groomFamily} onChange={set("groomFamily")} hint="İki satır en iyi sonucu verir: adlar, alt satırda soyadı." />
        <Area label="Aileler sayfasındaki söz" optional max={140} value={i.familyNote} onChange={set("familyNote")} />
      </Group>

      <Group id="tarih" icon="calendar" title="Tarih" meta="doldurulacak alan yok" missing={0} open={false} enabled={on(draft, "tarih")} onOpen={() => {}} onToggle={(v) => toggle("tarih", v)} />

      <Group id="konum" icon="pin" title="Konum" meta="3 alan" missing={missingOf(errors, ["place", "venue"])} open={open === "konum"} enabled={on(draft, "konum")} onOpen={() => setOpen(open === "konum" ? "" : "konum")} onToggle={(v) => toggle("konum", v)}>
        <Field id="alan-place" label="Mekân konumu" required error={errors.place} value={i.place} onChange={set("place")} placeholder="Mekân adı veya adres" />
        <Field label="Google Haritalar bağlantısı (isteğe bağlı)" value={i.mapUrl} onChange={set("mapUrl")} placeholder="https://maps.google.com/…" />
        <p className="field__hint">Bağlantıyı yapıştırırsanız harita tam noktayı gösterir. Adresi yazın ya da Google Haritalar bağlantısını yapıştırın.</p>
        <Field id="alan-venue" label="Mekân adı" required error={errors.venue} max={48} value={i.venue} onChange={set("venue")} />
        <Field label="Adres" optional max={110} value={i.address} onChange={set("address")} />
      </Group>

      <Group id="geri-sayim" icon="clock" title="Geri sayım" meta="doldurulacak alan yok" missing={0} open={false} enabled={on(draft, "geri-sayim")} onOpen={() => {}} onToggle={(v) => toggle("geri-sayim", v)} />

      <Group id="hikaye" icon="heart" title="Hikâyemiz" meta={on(draft, "hikaye") ? "1 alan" : "kapalı · davetiyede görünmez"} missing={0} open={open === "hikaye"} enabled={on(draft, "hikaye")} onOpen={() => setOpen(open === "hikaye" ? "" : "hikaye")} onToggle={(v) => toggle("hikaye", v)}>
        <Area label="Hikâyeniz" optional max={480} value={i.story} onChange={set("story")} />
      </Group>

      <Group id="program" icon="sliders" title="Program akışı" meta="1 alan" missing={errors.program ? 1 : 0} open={open === "program"} enabled={on(draft, "program")} onOpen={() => setOpen(open === "program" ? "" : "program")} onToggle={(v) => toggle("program", v)}>
        <Program draft={draft} />
        {errors.program && <p className="field__error">{errors.program}</p>}
      </Group>

      <Group id="kiyafet" icon="tag" title="Kıyafet kodu" meta={on(draft, "kiyafet") ? "1 alan" : "kapalı · davetiyede görünmez"} missing={0} open={open === "kiyafet"} enabled={on(draft, "kiyafet")} onOpen={() => setOpen(open === "kiyafet" ? "" : "kiyafet")} onToggle={(v) => toggle("kiyafet", v)}>
        <Field label="Kıyafet kodu" optional max={40} value={i.dressCode} onChange={set("dressCode")} placeholder="Kokteyl" />
      </Group>

      <Group id="album" icon="image" title="Albümümüz" meta={on(draft, "album") ? "fotoğraflar" : "kapalı · davetiyede görünmez"} missing={0} open={open === "album"} enabled={on(draft, "album")} onOpen={() => setOpen(open === "album" ? "" : "album")} onToggle={(v) => toggle("album", v)}>
        <p className="field__hint">Fotoğraflar ödeme sonrası panelden eklenir. Bu adımda bölümü açmanız yeter.</p>
      </Group>

      <Group id="menu" icon="doc" title="Menü" meta={on(draft, "menu") ? "1 alan" : "kapalı · davetiyede görünmez"} missing={0} open={open === "menu"} enabled={on(draft, "menu")} onOpen={() => setOpen(open === "menu" ? "" : "menu")} onToggle={(v) => toggle("menu", v)}>
        <Area label="Menü" optional max={400} value={i.menu} onChange={set("menu")} />
      </Group>

      {RSVP_FORM_ENABLED && (
        <Group id="katilim" icon="check" title="Katılım formu" meta="doldurulacak alan yok" missing={0} open={false} enabled={on(draft, "katilim")} onOpen={() => {}} onToggle={(v) => toggle("katilim", v)} />
      )}

      <AddonGroup
        id="ani-duvari"
        icon="camera"
        title="Anı duvarı"
        price={wall?.included ? "Dahil" : wall ? `+${formatTL(wall.price)}` : ""}
        enabled={on(draft, "ani-duvari")}
        onToggle={(v) => {
          toggle("ani-duvari", v);
          if (wall && !wall.included) toggleAddon(wall.id, v);
        }}
      />
      <AddonGroup
        id="ani-cekimi"
        icon="camera"
        title="Anı çekimi"
        price={lens?.included || !lens?.price ? "Ücretsiz" : `+${formatTL(lens.price)}`}
        enabled={on(draft, "ani-cekimi")}
        onToggle={(v) => {
          toggle("ani-cekimi", v);
          if (lens && !lens.included) toggleAddon(lens.id, v);
        }}
      />

      <Group id="dilekler" icon="heart" title="Dilekler" meta="doldurulacak alan yok" missing={0} open={false} enabled={on(draft, "dilekler")} onOpen={() => {}} onToggle={(v) => toggle("dilekler", v)} />

      <Group id="iban" icon="gift" title="Hediye / IBAN" meta="2 alan" missing={missingOf(errors, ["ibanHolder", "iban"])} open={open === "iban"} enabled={on(draft, "iban")} onOpen={() => setOpen(open === "iban" ? "" : "iban")} onToggle={(v) => toggle("iban", v)}>
        <Field id="alan-ibanHolder" label="Hesap sahibi" required error={errors.ibanHolder} max={40} value={i.ibanHolder} onChange={set("ibanHolder")} />
        <Field id="alan-iban" label="IBAN" required error={errors.iban} value={i.iban} onChange={(v) => set("iban")(formatIban(v))} placeholder="TR00 0000 0000 0000 0000 0000 00" />
      </Group>

      <Group id="kapanis" icon="sparkle" title="Kapanış" meta="1 alan" missing={0} open={open === "kapanis"} enabled={on(draft, "kapanis")} onOpen={() => setOpen(open === "kapanis" ? "" : "kapanis")} onToggle={(v) => toggle("kapanis", v)}>
        <Area label="Kapanış metni" optional max={140} value={i.closing} onChange={set("closing")} />
      </Group>

      <Group id="muzik" icon="music" title="Fon müziği" meta="" missing={0} open={open === "muzik"} enabled locked onOpen={() => setOpen(open === "muzik" ? "" : "muzik")} onToggle={() => {}}>
        <div className="music-pick">
          <label><input type="radio" name="music" checked={i.music === "default"} onChange={() => set("music")("default")} /> Davetiyenin müziği</label>
          <label><input type="radio" name="music" checked={i.music !== "default" && i.music !== "none"} onChange={() => set("music")(TRACKS[0].id)} /> Kütüphaneden seç</label>
          {i.music !== "default" && i.music !== "none" && (
            <select className="input" value={i.music} onChange={(e) => set("music")(e.target.value)} aria-label="Parça">
              {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          )}
          <label><input type="radio" name="music" checked={i.music === "none"} onChange={() => set("music")("none")} /> Müzik olmasın</label>
        </div>
      </Group>

      <PrintCards draft={draft} />
    </div>
  );
}

function countGroups(draft: InvitationDraft) {
  const i = draft.info;
  const groups = [
    { on: true, bad: i.partnerA.trim().length < 2 || i.partnerB.trim().length < 2 || !i.date },
    { on: on(draft, "aileler"), bad: i.brideFamily.trim().length < 2 || i.groomFamily.trim().length < 2 },
    { on: on(draft, "konum"), bad: i.venue.trim().length < 2 || i.place.trim().length < 2 },
    { on: on(draft, "program"), bad: !draft.program.some((p) => p.title.trim() || p.time.trim()) },
    { on: on(draft, "iban"), bad: i.ibanHolder.trim().length < 2 || i.iban.replace(/\s/g, "").length < 26 },
    { on: on(draft, "kapanis"), bad: false },
  ].filter((g) => g.on);
  let missing = 0;
  if (i.partnerA.trim().length < 2) missing++;
  if (i.partnerB.trim().length < 2) missing++;
  if (!i.date) missing++;
  if (on(draft, "aileler")) {
    if (i.brideFamily.trim().length < 2) missing++;
    if (i.groomFamily.trim().length < 2) missing++;
  }
  if (on(draft, "konum")) {
    if (i.place.trim().length < 2) missing++;
    if (i.venue.trim().length < 2) missing++;
  }
  if (on(draft, "program") && !draft.program.some((p) => p.title.trim() || p.time.trim())) missing++;
  if (on(draft, "iban")) {
    if (i.ibanHolder.trim().length < 2) missing++;
    if (i.iban.replace(/\s/g, "").length < 26) missing++;
  }
  return { total: groups.length, done: groups.filter((g) => !g.bad).length, missing };
}

function missingOf(errors: Errors, keys: string[]) {
  return keys.filter((k) => errors[k]).length;
}

function Group({
  id, icon, title, meta, missing, open, enabled, locked, onOpen, onToggle, children,
}: {
  id: string;
  icon: IconName;
  title: string;
  meta: string;
  missing: number;
  open: boolean;
  enabled: boolean;
  locked?: boolean;
  onOpen: () => void;
  onToggle: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <section className={`acc${enabled ? "" : " is-off"}${open ? " is-open" : ""}`}>
      <div className="acc__bar">
        <button type="button" className="acc__open" onClick={onOpen} disabled={!enabled} aria-expanded={open}>
          <Icon name={icon} size={16} />
          <strong>{title}</strong>
          {meta && <small>{meta}</small>}
          {enabled && missing > 0 && <em>{missing} eksik</em>}
          {!enabled && <em>kapalı</em>}
        </button>
        <label className="acc__switch">
          <span className="sr-only">{title}</span>
          <input type="checkbox" checked={enabled} disabled={locked} onChange={(e) => onToggle(e.target.checked)} />
        </label>
      </div>
      {open && enabled && children && <div className="acc__body">{children}</div>}
    </section>
  );
}

function AddonGroup({ id, icon, title, price, enabled, onToggle }: { id: string; icon: IconName; title: string; price: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <section className={`acc${enabled ? "" : " is-off"}`}>
      <div className="acc__bar">
        <button type="button" className="acc__open" disabled aria-expanded={false}>
          <Icon name={icon} size={16} />
          <strong>{title}</strong>
          <small>{enabled ? "" : "kapalı · davetiyede görünmez"}</small>
          {price && <em className="num">{price}</em>}
        </button>
        <label className="acc__switch">
          <span className="sr-only">{title}</span>
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        </label>
      </div>
      <span className="sr-only">{id}</span>
    </section>
  );
}

function Field({
  id, label, value, onChange, required, optional, error, max, placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  optional?: boolean;
  error?: string;
  max?: number;
  placeholder?: string;
}) {
  return (
    <label className="info-field">
      <span>{label} {required && <i>Zorunlu</i>} {optional && <i>İsteğe bağlı</i>}</span>
      <input
        id={id}
        className="input"
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
      />
      {max ? <b className="num">{value.length}/{max}</b> : null}
      {error && <small className="field__error">{error}</small>}
    </label>
  );
}

function Area({
  id, label, value, onChange, required, optional, error, max, hint,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  optional?: boolean;
  error?: string;
  max?: number;
  hint?: string;
}) {
  return (
    <label className="info-field">
      <span>{label} {required && <i>Zorunlu</i>} {optional && <i>İsteğe bağlı</i>}</span>
      <textarea id={id} className="input" rows={3} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
      {max ? <b className="num">{value.length}/{max}</b> : null}
      {hint && <small>{hint}</small>}
      {error && <small className="field__error">{error}</small>}
    </label>
  );
}

function Program({ draft }: { draft: InvitationDraft }) {
  const program = draft.program;
  function setProgram(next: DraftProgramItem[]) {
    saveDraft({ program: next });
  }
  return (
    <div className="wz-program" id="alan-program">
      <ul className="wz-program__list">
        {program.map((row, index) => (
          <li key={index} className="wz-program__row">
            <input className="input wz-program__time" type="time" value={row.time} aria-label={`Saat ${index + 1}`} onChange={(e) => setProgram(program.map((r, i) => i === index ? { ...r, time: e.target.value } : r))} />
            <input className="input wz-program__title" value={row.title} placeholder="Nikâh Töreni" aria-label={`Başlık ${index + 1}`} onChange={(e) => setProgram(program.map((r, i) => i === index ? { ...r, title: e.target.value } : r))} />
            <input className="input wz-program__note" value={row.note} placeholder="İsteğe bağlı" aria-label={`Not ${index + 1}`} onChange={(e) => setProgram(program.map((r, i) => i === index ? { ...r, note: e.target.value } : r))} />
            <button type="button" className="btn btn--ghost btn--sm" disabled={program.length <= 1} aria-label="Satırı sil" onClick={() => setProgram(program.filter((_, i) => i !== index))}>
              <Icon name="close" size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--outline btn--sm" disabled={program.length >= 6} onClick={() => setProgram([...program, { time: "", title: "", note: "" }])}>
        <Icon name="plus" size={14} /> Satır ekle
      </button>
      <p className="field__hint">En az 1, en fazla 6 satır</p>
    </div>
  );
}
