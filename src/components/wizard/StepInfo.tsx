"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon, { type IconName } from "../Icon";
import PrintCards from "./PrintCards";
import { useCatalog } from "@/components/CatalogProvider";
import { invitationSections } from "@/i18n/product";
import { marketing } from "@/i18n/marketing";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import { formatIban, formatTL } from "@/lib/format";
import { BABY_HIDDEN_SECTIONS, isBabyShowerTemplate, isPartyTemplate, saveDraft, type DraftInfo, type DraftProgramItem, type InvitationDraft } from "@/lib/storage";
import PartyInfo from "./PartyInfo";
import { fileToDraftPhoto } from "@/lib/newspaperDraft";
import { MUSIC_TRACKS } from "@/lib/musicCatalog";
import { NAME_FONTS, nameFontFaceCss, nameFontOf, nameFontStack } from "@/lib/nameFonts";
import { RSVP_FORM_ENABLED } from "@/data/sections";
import Time24 from "./Time24";
import { gapSentence, INFO_FIELDS, type Errors } from "./validate";

const DEFAULT_OFF = ["hikaye", "kiyafet", "album", "menu", "ani-duvari", "ani-cekimi"];
const TRACKS = MUSIC_TRACKS;
const ALBUM_MAX = 8;

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function fieldsLabel(locale: Locale, n: number) {
  if (locale === "en") return n === 1 ? "1 field" : `${n} fields`;
  return `${n} alan`;
}

function closedMeta(locale: Locale) {
  return tx(locale, "kapalı · davetiyede görünmez", "off · hidden on the invitation");
}

function on(draft: InvitationDraft, id: string) {
  return !draft.hiddenSections.includes(id);
}

export default function StepInfo({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  const locale = useLocale();
  const cat = useCatalog();
  const i = draft.info;
  const [open, setOpen] = useState("isimler");
  const aimed = useRef("");
  const wall = cat.addons.find((a) => a.id === "ani-duvari");
  const lens = cat.addons.find((a) => a.id === "ani-cekimi");
  const sections = invitationSections(locale);
  const sec = (id: string) => sections.find((s) => s.id === id)?.title ?? id;
  const copy = marketing(locale);
  const included = tx(locale, "Dahil", "Included");
  const none = tx(locale, "doldurulacak alan yok", "nothing to fill in");

  const baby = draft.event === "bebek" || isBabyShowerTemplate(draft.template);
  const party = draft.event === "parti" || isPartyTemplate(draft.template);

  useEffect(() => {
    if (party) return;
    if (baby) {
      const keepOn = new Set(["konum", "kapanis", "kiyafet"]);
      const next = Array.from(new Set([...draft.hiddenSections, ...BABY_HIDDEN_SECTIONS])).filter(
        (id) => !keepOn.has(id),
      );
      const same =
        next.length === draft.hiddenSections.length && next.every((id) => draft.hiddenSections.includes(id));
      if (!same) saveDraft({ hiddenSections: next });
      return;
    }
    if (draft.hiddenSections.length) return;
    if (i.partnerA.trim() || i.venue.trim()) return;
    saveDraft({ hiddenSections: DEFAULT_OFF });
  }, [draft.hiddenSections, i.partnerA, i.venue, baby, party]);

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
  const setAlbumPhotos = (photos: string[]) => saveDraft({ info: { ...i, albumPhotos: photos.slice(0, ALBUM_MAX) } });
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

  if (party) return <PartyInfo draft={draft} errors={errors} />;

  return (
    <div className="info-step">
      <div className="info-progress" role="status">
        <strong>{tx(locale, `${groups.done} / ${groups.total} bölüm tamam`, `${groups.done} of ${groups.total} sections complete`)}</strong>
        <p>{groups.missing ? gapSentence(groups.missing, locale) : tx(locale, "Zorunlu bilgiler tamam.", "The required details are complete.")}</p>
        <progress value={groups.done} max={groups.total} aria-label={tx(locale, `${groups.done} / ${groups.total} bölüm tamam`, `${groups.done} of ${groups.total} sections complete`)} />
      </div>

      <Group
        id="isimler"
        icon="user"
        title={baby ? tx(locale, "Davetiye bilgileri", "Invitation details") : sec("isimler")}
        meta={fieldsLabel(locale, baby ? 7 : 4)}
        missing={missingOf(errors, baby ? ["partnerA", "partnerB", "story", "familyNote", "message", "date"] : ["partnerA", "partnerB", "date"])}
        open={open === "isimler"}
        enabled
        locked
        onOpen={() => setOpen(open === "isimler" ? "" : "isimler")}
        onToggle={() => {}}
      >
        <Field
          id="alan-partnerA"
          label={baby ? tx(locale, "Anne adayı", "Expectant mother") : tx(locale, "Gelinin adı", "Bride’s name")}
          required
          error={errors.partnerA}
          max={24}
          value={i.partnerA}
          onChange={set("partnerA")}
          placeholder={baby ? "Elif" : "Ayşe"}
        />
        <Field
          id="alan-partnerB"
          label={baby ? tx(locale, "Baba adayı", "Expectant father") : tx(locale, "Damadın adı", "Groom’s name")}
          required
          error={errors.partnerB}
          max={24}
          value={i.partnerB}
          onChange={set("partnerB")}
          placeholder={baby ? "Can" : "Mehmet"}
        />
        {baby ? (
          <>
            <Field
              id="alan-babyName"
              label={tx(locale, "Bebeğin adı", "Baby’s name")}
              required
              error={errors.story}
              max={40}
              value={i.story}
              onChange={set("story")}
              placeholder={tx(locale, "Minik Ada", "Little Ada")}
            />
            <Field
              id="alan-inviteTitle"
              label={tx(locale, "Davet başlığı", "Invitation title")}
              required
              error={errors.familyNote}
              max={48}
              value={i.familyNote}
              onChange={set("familyNote")}
              placeholder={tx(locale, "Minik Bir Mucize Geliyor!", "A Little Miracle Is Coming!")}
            />
            <Area
              id="alan-inviteMessage"
              label={tx(locale, "Kısa davet metni", "Short invitation text")}
              required
              error={errors.message}
              max={180}
              value={i.message}
              onChange={set("message")}
              hint={tx(
                locale,
                "Örnek: Bebeğimizi beklerken bu tatlı heyecanı bizimle paylaşmaya davetlisiniz.",
                "Example: While we wait for our baby, you're invited to share this sweet excitement with us.",
              )}
            />
          </>
        ) : null}
        {!baby ? (
          <NameFontPicker
            locale={locale}
            value={i.nameFont || "default"}
            partnerA={i.partnerA}
            partnerB={i.partnerB}
            onChange={set("nameFont")}
          />
        ) : null}
        <label className="info-field">
          <span>{tx(locale, "Tarih ve saat", "Date and time")} <i>{tx(locale, "Zorunlu", "Required")}</i></span>
          <span className="info-field__row">
            <input id="alan-date" className="input" type="date" value={i.date} onChange={(e) => set("date")(e.target.value)} aria-invalid={errors.date ? true : undefined} />
            <Time24 id="alan-time" value={i.time} onChange={set("time")} aria-label={tx(locale, "Etkinlik saati", "Event time")} aria-invalid={Boolean(errors.time)} />
          </span>
          {errors.date && <small className="field__error">{errors.date}</small>}
          {errors.time && <small className="field__error">{errors.time}</small>}
        </label>
        {!baby && draft.event === "coklu" && (
          <label className="info-field">
            <span>{tx(locale, "Kına tarihi ve saati", "Henna date and time")} <i>{tx(locale, "Zorunlu", "Required")}</i></span>
            <span className="info-field__row">
              <input id="alan-kinaDate" className="input" type="date" value={i.kinaDate} onChange={(e) => set("kinaDate")(e.target.value)} aria-invalid={errors.kinaDate ? true : undefined} />
              <Time24 value={i.kinaTime} onChange={set("kinaTime")} aria-label={tx(locale, "Kına saati", "Henna time")} />
            </span>
            {errors.kinaDate && <small className="field__error">{errors.kinaDate}</small>}
          </label>
        )}
        {!baby ? (
          <label className="info-field">
            <span>{tx(locale, "Bitiş saati (isteğe bağlı)", "End time (optional)")}</span>
            <Time24 value={i.endTime || ""} onChange={set("endTime")} aria-label={tx(locale, "Bitiş saati", "End time")} optional />
            <small>{tx(locale, "Girerseniz saat aralık olarak görünür (ör. 19:00–23:00).", "If you enter it, the time is shown as a range (for example 19:00–23:00).")}</small>
          </label>
        ) : null}
        {!baby ? (
          <Area
            label={tx(locale, "Davet metni", "Invitation line")}
            optional
            max={100}
            value={i.message}
            onChange={set("message")}
            hint={tx(locale, "Kısa bir cümle en iyi sonucu verir.", "A short sentence works best.")}
          />
        ) : null}
      </Group>

      {!baby ? (
        <Group id="aileler" icon="home" title={sec("aileler")} meta={fieldsLabel(locale, 3)} missing={missingOf(errors, ["brideFamily", "groomFamily"])} open={open === "aileler"} enabled={on(draft, "aileler")} onOpen={() => setOpen(open === "aileler" ? "" : "aileler")} onToggle={(v) => toggle("aileler", v)}>
          <Area id="alan-brideFamily" label={tx(locale, "Gelinin ailesi", "Bride’s family")} required error={errors.brideFamily} max={60} value={i.brideFamily} onChange={set("brideFamily")} hint={tx(locale, "İki satır en iyi sonucu verir: adlar, alt satırda soyadı.", "Two lines work best: the names, then the surname on the line below.")} />
          <Area id="alan-groomFamily" label={tx(locale, "Damadın ailesi", "Groom’s family")} required error={errors.groomFamily} max={60} value={i.groomFamily} onChange={set("groomFamily")} hint={tx(locale, "İki satır en iyi sonucu verir: adlar, alt satırda soyadı.", "Two lines work best: the names, then the surname on the line below.")} />
          <Area label={tx(locale, "Aileler sayfasındaki söz", "Line on the families page")} optional max={140} value={i.familyNote} onChange={set("familyNote")} />
        </Group>
      ) : null}

      {!baby ? <Group id="tarih" icon="calendar" title={sec("tarih")} meta={none} missing={0} open={false} enabled={on(draft, "tarih")} onOpen={() => {}} onToggle={(v) => toggle("tarih", v)} /> : null}

      <Group id="konum" icon="pin" title={baby ? tx(locale, "Mekân", "Venue") : sec("konum")} meta={fieldsLabel(locale, baby ? 2 : 3)} missing={missingOf(errors, baby ? ["venue", "address"] : ["place", "venue"])} open={open === "konum"} enabled={on(draft, "konum")} onOpen={() => setOpen(open === "konum" ? "" : "konum")} onToggle={baby ? () => {} : (v) => toggle("konum", v)} locked={baby}>
        <Field
          id="alan-venue"
          label={tx(locale, "Mekân adı", "Venue name")}
          required
          error={errors.venue}
          max={48}
          value={i.venue}
          onChange={(v) => {
            const next = { ...i, venue: v };
            if (baby && (!i.place.trim() || i.place === i.venue)) next.place = v;
            saveDraft({ info: next });
          }}
        />
        <Field
          id="alan-address"
          label={tx(locale, "Açık adres", "Full address")}
          required={baby}
          error={errors.address}
          max={110}
          value={i.address}
          onChange={set("address")}
        />
        {!baby ? (
          <Field id="alan-place" label={tx(locale, "Mekân konumu", "Venue location")} required error={errors.place} value={i.place} onChange={set("place")} placeholder={tx(locale, "Mekân adı veya adres", "Venue name or address")} />
        ) : null}
        <Field label={tx(locale, "Google Haritalar bağlantısı (isteğe bağlı)", "Google Maps link (optional)")} value={i.mapUrl} onChange={set("mapUrl")} placeholder="https://maps.google.com/…" />
        <p className="field__hint">{tx(locale, "Bağlantıyı yapıştırırsanız Konumu Göster bunu açar. Yoksa mekân adından harita aranır.", "If you paste a link, Show location opens it. Otherwise the venue name is used for map search.")}</p>
      </Group>

      {!baby ? <Group id="geri-sayim" icon="clock" title={sec("geri-sayim")} meta={none} missing={0} open={false} enabled={on(draft, "geri-sayim")} onOpen={() => {}} onToggle={(v) => toggle("geri-sayim", v)} /> : null}

      {!baby ? (
        <Group id="hikaye" icon="heart" title={sec("hikaye")} meta={on(draft, "hikaye") ? fieldsLabel(locale, 1) : closedMeta(locale)} missing={0} open={open === "hikaye"} enabled={on(draft, "hikaye")} onOpen={() => setOpen(open === "hikaye" ? "" : "hikaye")} onToggle={(v) => toggle("hikaye", v)}>
          <Area label={tx(locale, "Hikâyeniz", "Your story")} optional max={480} value={i.story} onChange={set("story")} />
        </Group>
      ) : null}

      {!baby ? (
        <Group id="program" icon="sliders" title={sec("program")} meta={fieldsLabel(locale, 1)} missing={errors.program ? 1 : 0} open={open === "program"} enabled={on(draft, "program")} onOpen={() => setOpen(open === "program" ? "" : "program")} onToggle={(v) => toggle("program", v)}>
          <Program draft={draft} />
          {errors.program && <p className="field__error">{errors.program}</p>}
        </Group>
      ) : null}

      <Group
        id="kiyafet"
        icon="tag"
        title={baby ? tx(locale, "Kıyafet / tema", "Outfit / theme") : sec("kiyafet")}
        meta={on(draft, "kiyafet") ? fieldsLabel(locale, 1) : closedMeta(locale)}
        missing={0}
        open={open === "kiyafet"}
        enabled={on(draft, "kiyafet")}
        onOpen={() => setOpen(open === "kiyafet" ? "" : "kiyafet")}
        onToggle={baby ? () => {} : (v) => toggle("kiyafet", v)}
        locked={baby}
      >
        <Field
          label={baby ? tx(locale, "Kıyafet renkleri / tema", "Clothing colors / theme") : tx(locale, "Kıyafet kodu", "Dress code")}
          optional
          max={60}
          value={i.dressCode}
          onChange={set("dressCode")}
          placeholder={baby ? tx(locale, "Pastel mavi & krem", "Pastel blue & cream") : tx(locale, "Kokteyl", "Cocktail")}
        />
      </Group>

      {!baby ? (
        <Group id="album" icon="image" title={sec("album")} meta={on(draft, "album") ? tx(locale, `${(i.albumPhotos || []).length} fotoğraf`, `${(i.albumPhotos || []).length} photos`) : closedMeta(locale)} missing={0} open={open === "album"} enabled={on(draft, "album")} onOpen={() => setOpen(open === "album" ? "" : "album")} onToggle={(v) => toggle("album", v)}>
          <p className="field__hint">{tx(locale, "En fazla 8 fotoğraf ekleyin; davetiyede kolaj olarak görünür.", "Add up to 8 photos; they appear as a collage on the invitation.")}</p>
          <div className="wz-album">
            <ul className="wz-album__grid">
              {(i.albumPhotos || []).map((url, index) => (
                <li key={`${index}-${url.slice(-24)}`}>
                  <img src={url} alt="" />
                  <button
                    type="button"
                    className="wz-album__remove"
                    aria-label={tx(locale, `Fotoğraf ${index + 1} kaldır`, `Remove photo ${index + 1}`)}
                    onClick={() => setAlbumPhotos((i.albumPhotos || []).filter((_, n) => n !== index))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            {(i.albumPhotos || []).length < ALBUM_MAX ? (
              <label className="wz-album__add">
                <span>{tx(locale, "Fotoğraf ekle", "Add photos")}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={async (e) => {
                    const files = [...(e.target.files || [])];
                    e.currentTarget.value = "";
                    if (!files.length) return;
                    const room = ALBUM_MAX - (i.albumPhotos || []).length;
                    const next = [...(i.albumPhotos || [])];
                    for (const file of files.slice(0, room)) {
                      try {
                        next.push(await fileToDraftPhoto(file, 960, 0.7));
                      } catch {
                        /* skip bad files */
                      }
                    }
                    setAlbumPhotos(next);
                  }}
                />
              </label>
            ) : null}
          </div>
        </Group>
      ) : null}

      {!baby ? (
        <Group id="menu" icon="doc" title={sec("menu")} meta={on(draft, "menu") ? fieldsLabel(locale, 1) : closedMeta(locale)} missing={0} open={open === "menu"} enabled={on(draft, "menu")} onOpen={() => setOpen(open === "menu" ? "" : "menu")} onToggle={(v) => toggle("menu", v)}>
          <Area label={tx(locale, "Menü", "Menu")} optional max={400} value={i.menu} onChange={set("menu")} />
        </Group>
      ) : null}

      {!baby && RSVP_FORM_ENABLED ? (
        <Group id="katilim" icon="check" title={sec("katilim")} meta={none} missing={0} open={false} enabled={on(draft, "katilim")} onOpen={() => {}} onToggle={(v) => toggle("katilim", v)} />
      ) : null}

      {!baby ? (
        <>
          <AddonGroup
            id="ani-duvari"
            icon="camera"
            title={sec("ani-duvari")}
            price={wall?.included ? included : wall ? `+${formatTL(wall.price, locale)}` : ""}
            enabled={on(draft, "ani-duvari")}
            onToggle={(v) => {
              toggle("ani-duvari", v);
              if (wall && !wall.included) toggleAddon(wall.id, v);
            }}
          />
          <AddonGroup
            id="ani-cekimi"
            icon="camera"
            title={sec("ani-cekimi")}
            price={lens?.included || !lens?.price ? copy.free : `+${formatTL(lens.price, locale)}`}
            enabled={on(draft, "ani-cekimi")}
            onToggle={(v) => {
              toggle("ani-cekimi", v);
              if (lens && !lens.included) toggleAddon(lens.id, v);
            }}
          />
          <Group id="dilekler" icon="heart" title={sec("dilekler")} meta={none} missing={0} open={false} enabled={on(draft, "dilekler")} onOpen={() => {}} onToggle={(v) => toggle("dilekler", v)} />
          <Group id="iban" icon="gift" title={sec("iban")} meta={fieldsLabel(locale, 2)} missing={missingOf(errors, ["ibanHolder", "iban"])} open={open === "iban"} enabled={on(draft, "iban")} onOpen={() => setOpen(open === "iban" ? "" : "iban")} onToggle={(v) => toggle("iban", v)}>
            <Field id="alan-ibanHolder" label={tx(locale, "Hesap sahibi", "Account holder")} required error={errors.ibanHolder} max={40} value={i.ibanHolder} onChange={set("ibanHolder")} />
            <Field id="alan-iban" label="IBAN" required error={errors.iban} value={i.iban} onChange={(v) => set("iban")(formatIban(v))} placeholder="TR00 0000 0000 0000 0000 0000 00" />
          </Group>
        </>
      ) : null}

      <Group id="kapanis" icon="sparkle" title={baby ? tx(locale, "Katılım bildirimi (LCV)", "RSVP") : sec("kapanis")} meta={fieldsLabel(locale, baby ? 2 : 1)} missing={missingOf(errors, baby ? ["closing"] : [])} open={open === "kapanis"} enabled={on(draft, "kapanis")} onOpen={() => setOpen(open === "kapanis" ? "" : "kapanis")} onToggle={baby ? () => {} : (v) => toggle("kapanis", v)} locked={baby}>
        {baby ? (
          <>
            <Field
              id="alan-rsvpPhone"
              label={tx(locale, "İletişim numarası", "Contact number")}
              required
              error={errors.closing}
              max={40}
              value={i.closing}
              onChange={set("closing")}
              placeholder="0532 000 00 00"
            />
            <label className="info-field">
              <span>{tx(locale, "Son yanıt tarihi", "RSVP deadline")} <em>{tx(locale, "İsteğe bağlı", "Optional")}</em></span>
              <input
                id="alan-rsvpDeadline"
                className="input"
                type="date"
                value={i.kinaDate || ""}
                onChange={(e) => set("kinaDate")(e.target.value)}
              />
              <small>{tx(locale, "Misafirlerin LCV için son günü.", "Last day for guests to RSVP.")}</small>
            </label>
          </>
        ) : (
          <Area
            label={tx(locale, "Kapanış metni", "Closing line")}
            optional
            max={140}
            value={i.closing}
            onChange={set("closing")}
          />
        )}
      </Group>

      <Group id="muzik" icon="music" title={tx(locale, "Fon müziği", "Background music")} meta="" missing={0} open={open === "muzik"} enabled locked onOpen={() => setOpen(open === "muzik" ? "" : "muzik")} onToggle={() => {}}>
        <div className="music-pick">
          <label><input type="radio" name="music" checked={i.music === "default"} onChange={() => set("music")("default")} /> {tx(locale, "Davetiyenin müziği", "The invitation’s music")}</label>
          <label><input type="radio" name="music" checked={i.music !== "default" && i.music !== "none"} onChange={() => set("music")(TRACKS[0].id)} /> {tx(locale, "Kütüphaneden seç", "Choose from the library")}</label>
          {i.music !== "default" && i.music !== "none" && (
            <select className="input" value={i.music} onChange={(e) => set("music")(e.target.value)} aria-label={tx(locale, "Parça", "Track")}>
              {TRACKS.map((t) => <option key={t.id} value={t.id}>{locale === "en" ? t.en : t.tr}</option>)}
            </select>
          )}
          <label><input type="radio" name="music" checked={i.music === "none"} onChange={() => set("music")("none")} /> {tx(locale, "Müzik olmasın", "No music")}</label>
        </div>
      </Group>

      {!baby ? (
        <>
          <Group id="canli" icon="sparkle" title={tx(locale, "Düğün günü duyurusu", "Wedding-day announcement")} meta={fieldsLabel(locale, 1)} missing={0} open={open === "canli"} enabled locked onOpen={() => setOpen(open === "canli" ? "" : "canli")} onToggle={() => {}}>
            <Area
              label={tx(locale, "Canlı gün notu", "Live-day note")}
              optional
              max={280}
              value={i.liveNote || ""}
              onChange={set("liveNote")}
              hint={tx(locale, "Etkinlik günü davetiyenin üstünde görünür (ör. “Nikâh 20:00’de salon B’de”).", "Shown at the top of the invitation on the event day (e.g. “Ceremony at 20:00 in hall B”).")}
            />
          </Group>
          <PrintCards draft={draft} />
        </>
      ) : null}
    </div>
  );
}

function countGroups(draft: InvitationDraft) {
  const i = draft.info;
  const baby = draft.event === "bebek" || isBabyShowerTemplate(draft.template);
  const groups = [
    {
      on: true,
      bad:
        i.partnerA.trim().length < 2 ||
        i.partnerB.trim().length < 2 ||
        !i.date ||
        (baby && (i.story.trim().length < 2 || i.familyNote.trim().length < 2 || i.message.trim().length < 2)),
    },
    { on: !baby && on(draft, "aileler"), bad: i.brideFamily.trim().length < 2 || i.groomFamily.trim().length < 2 },
    {
      on: on(draft, "konum"),
      bad: baby
        ? i.venue.trim().length < 2 || i.address.trim().length < 2
        : i.venue.trim().length < 2 || i.place.trim().length < 2,
    },
    { on: !baby && on(draft, "program"), bad: !draft.program.some((p) => p.title.trim() || p.time.trim()) },
    { on: !baby && on(draft, "iban"), bad: i.ibanHolder.trim().length < 2 || i.iban.replace(/\s/g, "").length < 26 },
    { on: on(draft, "kapanis"), bad: baby ? i.closing.trim().length < 7 : false },
    { on: baby && on(draft, "kiyafet"), bad: false },
  ].filter((g) => g.on);
  let missing = 0;
  if (i.partnerA.trim().length < 2) missing++;
  if (i.partnerB.trim().length < 2) missing++;
  if (baby && i.story.trim().length < 2) missing++;
  if (baby && i.familyNote.trim().length < 2) missing++;
  if (baby && i.message.trim().length < 2) missing++;
  if (!i.date) missing++;
  if (!baby && on(draft, "aileler")) {
    if (i.brideFamily.trim().length < 2) missing++;
    if (i.groomFamily.trim().length < 2) missing++;
  }
  if (on(draft, "konum")) {
    if (!baby && i.place.trim().length < 2) missing++;
    if (i.venue.trim().length < 2) missing++;
    if (baby && i.address.trim().length < 2) missing++;
  }
  if (!baby && on(draft, "program") && !draft.program.some((p) => p.title.trim() || p.time.trim())) missing++;
  if (!baby && on(draft, "iban")) {
    if (i.ibanHolder.trim().length < 2) missing++;
    if (i.iban.replace(/\s/g, "").length < 26) missing++;
  }
  if (baby && i.closing.trim().length < 7) missing++;
  return { total: groups.length, done: groups.filter((g) => !g.bad).length, missing };
}

function missingOf(errors: Errors, keys: string[]) {
  return keys.filter((k) => errors[k]).length;
}

function Group({
  icon, title, meta, missing, open, enabled, locked, onOpen, onToggle, children,
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
  const locale = useLocale();
  return (
    <section className={`acc${enabled ? "" : " is-off"}${open ? " is-open" : ""}`}>
      <div className="acc__bar">
        <button type="button" className="acc__open" onClick={onOpen} disabled={!enabled} aria-expanded={open}>
          <Icon name={icon} size={16} />
          <strong>{title}</strong>
          {meta && <small>{meta}</small>}
          {enabled && missing > 0 && <em>{missing} {tx(locale, "eksik", "missing")}</em>}
          {!enabled && <em>{tx(locale, "kapalı", "off")}</em>}
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
  const locale = useLocale();
  return (
    <section className={`acc${enabled ? "" : " is-off"}`}>
      <div className="acc__bar">
        <button type="button" className="acc__open" disabled aria-expanded={false}>
          <Icon name={icon} size={16} />
          <strong>{title}</strong>
          <small>{enabled ? "" : tx(locale, "kapalı · davetiyede görünmez", "off · hidden on the invitation")}</small>
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

function NameFontPicker({
  locale,
  value,
  partnerA,
  partnerB,
  onChange,
}: {
  locale: Locale;
  value: string;
  partnerA: string;
  partnerB: string;
  onChange: (v: string) => void;
}) {
  const font = nameFontOf(value);
  const stack = nameFontStack(value);
  const a = partnerA.trim() || "Ayşe";
  const b = partnerB.trim() || "Mehmet";
  return (
    <div className="info-field name-font">
      <style>{nameFontFaceCss(value)}</style>
      {font.url ? <link rel="preload" href={font.url} as="font" type="font/woff2" crossOrigin="anonymous" /> : null}
      <label htmlFor="alan-nameFont">
        <span>{tx(locale, "İsim fontu", "Name font")}</span>
      </label>
      <select
        id="alan-nameFont"
        className="input"
        value={font.id}
        onChange={(e) => onChange(e.target.value)}
        aria-label={tx(locale, "İsim fontu", "Name font")}
      >
        {NAME_FONTS.map((item) => (
          <option key={item.id} value={item.id}>
            {locale === "en" ? item.en : item.tr}
          </option>
        ))}
      </select>
      <div className="name-font__preview" aria-live="polite">
        <p className="name-font__label">{tx(locale, "Canlı önizleme", "Live preview")}</p>
        <p className="name-font__sample" style={stack ? { fontFamily: stack } : undefined}>
          <span>{a}</span>
          <span className="name-font__amp" aria-hidden="true">&amp;</span>
          <span>{b}</span>
        </p>
        <p className="name-font__meta">{locale === "en" ? font.en : font.tr}</p>
      </div>
    </div>
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
  const locale = useLocale();
  return (
    <label className="info-field">
      <span>{label} {required && <i>{tx(locale, "Zorunlu", "Required")}</i>} {optional && <i>{tx(locale, "İsteğe bağlı", "Optional")}</i>}</span>
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
  const locale = useLocale();
  return (
    <label className="info-field">
      <span>{label} {required && <i>{tx(locale, "Zorunlu", "Required")}</i>} {optional && <i>{tx(locale, "İsteğe bağlı", "Optional")}</i>}</span>
      <textarea id={id} className="input" rows={3} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
      {max ? <b className="num">{value.length}/{max}</b> : null}
      {hint && <small>{hint}</small>}
      {error && <small className="field__error">{error}</small>}
    </label>
  );
}

function Program({ draft }: { draft: InvitationDraft }) {
  const locale = useLocale();
  const program = draft.program;
  function setProgram(next: DraftProgramItem[]) {
    saveDraft({ program: next });
  }
  return (
    <div className="wz-program" id="alan-program">
      <ul className="wz-program__list">
        {program.map((row, index) => (
          <li key={index} className="wz-program__row">
            <Time24 className="input wz-program__time" value={row.time} aria-label={tx(locale, `Saat ${index + 1}`, `Time ${index + 1}`)} onChange={(time) => setProgram(program.map((r, i) => i === index ? { ...r, time } : r))} />
            <input className="input wz-program__title" value={row.title} placeholder={tx(locale, "Nikâh Töreni", "Nikah ceremony")} aria-label={tx(locale, `Başlık ${index + 1}`, `Title ${index + 1}`)} onChange={(e) => setProgram(program.map((r, i) => i === index ? { ...r, title: e.target.value } : r))} />
            <input className="input wz-program__note" value={row.note} placeholder={tx(locale, "İsteğe bağlı", "Optional")} aria-label={tx(locale, `Not ${index + 1}`, `Note ${index + 1}`)} onChange={(e) => setProgram(program.map((r, i) => i === index ? { ...r, note: e.target.value } : r))} />
            <button type="button" className="btn btn--ghost btn--sm" disabled={program.length <= 1} aria-label={tx(locale, "Satırı sil", "Remove row")} onClick={() => setProgram(program.filter((_, i) => i !== index))}>
              <Icon name="close" size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--outline btn--sm" disabled={program.length >= 6} onClick={() => setProgram([...program, { time: "", title: "", note: "" }])}>
        <Icon name="plus" size={14} /> {tx(locale, "Satır ekle", "Add a row")}
      </button>
      <p className="field__hint">{tx(locale, "En az 1, en fazla 6 satır", "At least 1 row, and no more than 6")}</p>
    </div>
  );
}
