"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Icon from "../Icon";
import { Divider } from "./Decor";
import { Sec } from "./BasicSections";
import { useIv } from "./ctx";
import { SAMPLE } from "@/data/sample";
import { formatIban } from "@/lib/format";
import { getLocalJson, setLocalJson, type Rsvp, type Wish } from "@/lib/storage";

export interface WallPhoto {
  id: string;
  url: string;
  source: "upload" | "lens";
}

/* ----------------------------- RSVP ----------------------------- */

export function RsvpSection() {
  const { theme, style } = useIv();
  const uid = useId();
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"" | "yes" | "no">("");
  const [count, setCount] = useState(1);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: string; attending?: string; count?: string }>({});
  const [sent, setSent] = useState<Rsvp | null>(null);
  const [storeError, setStoreError] = useState(false);
  const errRef = useRef<HTMLDivElement>(null);

  function validate() {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = "Lütfen adınızı ve soyadınızı yazın.";
    if (!attending) e.attending = "Lütfen katılım durumunuzu seçin.";
    if (attending === "yes" && (!Number.isInteger(count) || count < 1 || count > 10))
      e.count = "Kişi sayısı 1 ile 10 arasında olmalıdır.";
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => errRef.current?.focus(), 0);
      return;
    }
    const entry: Rsvp = {
      name: name.trim(),
      attending: attending === "yes",
      count: attending === "yes" ? count : 0,
      note: note.trim(),
      at: new Date().toISOString(),
    };
    const key = `rsvp:${theme.slug}`;
    const list = getLocalJson<Rsvp[]>(key, []);
    const ok = setLocalJson(key, [...list, entry]);
    setStoreError(!ok);
    setSent(entry);
  }

  if (sent) {
    return (
      <Sec id="katilim" title="Katılım formu">
        <p className="iv-kicker">Katılım Durumu</p>
        <Divider kind={style.ornament} />
        <div className="iv-success" role="status">
          <Icon name="check" size={28} />
          <p>
            <strong>Teşekkürler, {sent.name}!</strong>
            <br />
            {sent.attending ? `${sent.count} kişi olarak katılımınız kaydedildi.` : "Katılamayacağınız bilgisi kaydedildi."}
          </p>
          <p className="iv-note">
            {storeError
              ? "Tarayıcı depolaması kullanılamadığı için yanıt kaydedilemedi."
              : "Önizleme: yanıtınız yalnızca bu tarayıcıda saklanır, kimseye gönderilmez."}
          </p>
          <button type="button" className="iv-btn" onClick={() => { setSent(null); setName(""); setAttending(""); setCount(1); setNote(""); }}>
            Yeni yanıt ekle
          </button>
        </div>
      </Sec>
    );
  }

  return (
    <Sec id="katilim" title="Katılım formu">
      <p className="iv-kicker">Katılım Durumu</p>
      <Divider kind={style.ornament} />
      <form className="iv-form" onSubmit={submit} noValidate>
        {Object.keys(errors).length > 0 && (
          <div ref={errRef} tabIndex={-1} className="iv-error-sum" role="alert">
            Lütfen işaretli alanları düzeltin.
          </div>
        )}
        <div className="iv-field">
          <label htmlFor={`${uid}-n`}>
            Adınız Soyadınız <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-n`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${uid}-n-e` : undefined}
          />
          {errors.name && <p id={`${uid}-n-e`} className="iv-field__err">{errors.name}</p>}
        </div>

        <fieldset className="iv-field" aria-describedby={errors.attending ? `${uid}-a-e` : undefined}>
          <legend>Katılım durumunuz <span aria-hidden="true">*</span></legend>
          <div className="iv-radios" role="radiogroup" aria-required="true">
            <label className={attending === "yes" ? "is-on" : ""}>
              <input type="radio" name={`${uid}-att`} checked={attending === "yes"} onChange={() => setAttending("yes")} />
              Katılıyorum
            </label>
            <label className={attending === "no" ? "is-on" : ""}>
              <input type="radio" name={`${uid}-att`} checked={attending === "no"} onChange={() => setAttending("no")} />
              Katılamıyorum
            </label>
          </div>
          {errors.attending && <p id={`${uid}-a-e`} className="iv-field__err">{errors.attending}</p>}
        </fieldset>

        {attending !== "no" && (
          <div className="iv-field">
            <label htmlFor={`${uid}-c`}>Kaç kişi katılacaksınız?</label>
            <div className="iv-stepper">
              <button type="button" aria-label="Kişi sayısını azalt" onClick={() => setCount((c) => Math.max(1, c - 1))}>
                −
              </button>
              <input
                id={`${uid}-c`}
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                aria-invalid={Boolean(errors.count)}
              />
              <button type="button" aria-label="Kişi sayısını artır" onClick={() => setCount((c) => Math.min(10, c + 1))}>
                +
              </button>
            </div>
            {errors.count && <p className="iv-field__err">{errors.count}</p>}
          </div>
        )}

        <div className="iv-field">
          <label htmlFor={`${uid}-note`}>Notunuz</label>
          <textarea id={`${uid}-note`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="İletmek istedikleriniz" maxLength={400} />
        </div>
        <button type="submit" className="iv-btn iv-btn--solid iv-btn--block">
          Gönder
        </button>
      </form>
    </Sec>
  );
}

/* --------------------------- Memory wall --------------------------- */

const MAX_PHOTOS = 12;
const MAX_BYTES = 8 * 1024 * 1024;

export function MemoryWallSection({
  photos,
  onAdd,
  onRemove,
}: {
  photos: WallPhoto[];
  onAdd: (p: WallPhoto) => void;
  onRemove: (id: string) => void;
}) {
  const { style } = useIv();
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    let added = 0;
    let rejected = "";
    let room = MAX_PHOTOS - photos.length;
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("image/")) {
        rejected = `“${f.name}” bir görsel değil.`;
        return;
      }
      if (f.size > MAX_BYTES) {
        rejected = `“${f.name}” 8 MB sınırını aşıyor.`;
        return;
      }
      if (room <= 0) {
        rejected = `En fazla ${MAX_PHOTOS} fotoğraf eklenebilir.`;
        return;
      }
      room--;
      added++;
      onAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url: URL.createObjectURL(f), source: "upload" });
    });
    if (rejected) setMsg({ kind: "err", text: rejected });
    else if (added) setMsg({ kind: "ok", text: `${added} fotoğraf eklendi.` });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Sec id="ani-duvari" title="Anı duvarı">
      <p className="iv-kicker">Anı Duvarı</p>
      <Divider kind={style.ornament} />
      <p className="iv-msg iv-msg--soft">
        Etkinlik günü çektiğiniz fotoğrafları bizimle paylaşın; en güzel anılar burada birikecek.
      </p>
      <input
        ref={inputRef}
        className="sr-only"
        id="iv-file"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles(e.target.files)}
        tabIndex={-1}
      />
      <button type="button" className="iv-btn iv-btn--solid" onClick={() => inputRef.current?.click()}>
        <Icon name="upload" size={16} /> Fotoğraf Yükle
      </button>
      <p className="iv-note">Önizleme: fotoğraflar sunucuya gönderilmez; yalnızca bu sayfada gösterilir.</p>
      <div role="status" aria-live="polite" className={msg ? `iv-status iv-status--${msg.kind}` : "sr-only"}>
        {msg?.text}
      </div>
      {photos.length === 0 ? (
        <p className="iv-empty">Henüz fotoğraf yok. İlk anıyı siz ekleyin.</p>
      ) : (
        <ul className="iv-wall">
          {photos.map((p, i) => (
            <li key={p.id}>
              {/* blob: URLs are not supported by next/image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Anı fotoğrafı ${i + 1}${p.source === "lens" ? " (Anı Çekimi)" : ""}`} />
              <button type="button" aria-label={`Fotoğraf ${i + 1} kaldır`} onClick={() => onRemove(p.id)}>
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sec>
  );
}

/* ------------------------------ Lens ------------------------------ */

export function LensSection({ onCapture }: { onCapture: (p: WallPhoto) => void }) {
  const { style, data } = useIv();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "live" | "error">("idle");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);
  const [note, setNote] = useState("");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState("idle");
  }, []);
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  async function start() {
    setError("");
    setNote("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("Kamera bu tarayıcıda ya da güvenli olmayan bağlantıda kullanılamıyor. Anı Duvarı bölümünden fotoğraf yükleyebilirsiniz.");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setState("live");
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          void v.play().catch(() => undefined);
        }
      });
    } catch (err) {
      setState("error");
      const name = (err as DOMException)?.name;
      setError(
        name === "NotAllowedError"
          ? "Kamera izni verilmedi. Tarayıcı ayarlarından izin verip tekrar deneyebilirsiniz."
          : name === "NotFoundError"
            ? "Bu cihazda kamera bulunamadı."
            : "Kamera açılamadı. Başka bir uygulama kamerayı kullanıyor olabilir.",
      );
    }
  }

  function snap() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const w = 720;
    const h = Math.round((v.videoHeight / v.videoWidth) * w);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h + 90;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fffcf7";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1); // mirror like a selfie preview
    ctx.drawImage(v, 0, 0, w, h);
    ctx.restore();
    ctx.strokeStyle = style.gold;
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = style.accent;
    ctx.font = "600 34px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(`${data.partnerA} & ${data.partnerB}`, w / 2, h + 56);
    c.toBlob((blob) => {
      if (!blob) return;
      onCapture({ id: `lens-${Date.now()}`, url: URL.createObjectURL(blob), source: "lens" });
      setFlash(true);
      setNote("Fotoğraf Anı Duvarı’na eklendi.");
      setTimeout(() => setFlash(false), 250);
    }, "image/jpeg", 0.88);
  }

  return (
    <Sec id="ani-cekimi" title="Anı çekimi">
      <p className="iv-kicker">Anı Çekimi</p>
      <Divider kind={style.ornament} />
      <p className="iv-msg iv-msg--soft">
        Etkinlik günü kameranızı açın; yakaladığınız anlar doğrudan albümümüze düşsün.
      </p>
      {state === "live" && (
        <div className={`iv-lens${flash ? " is-flash" : ""}`}>
          <video ref={videoRef} playsInline muted aria-label="Kamera önizlemesi" />
          <span className="iv-lens__frame" aria-hidden="true" />
          <span className="iv-lens__cap" aria-hidden="true">{data.partnerA} &amp; {data.partnerB}</span>
        </div>
      )}
      <div className="iv-actions">
        {state !== "live" ? (
          <button type="button" className="iv-btn iv-btn--solid" onClick={start} disabled={state === "starting"}>
            <Icon name="camera" size={16} /> {state === "starting" ? "Kamera açılıyor…" : "Kamerayı Aç"}
          </button>
        ) : (
          <>
            <button type="button" className="iv-btn iv-btn--solid" onClick={snap}>
              <Icon name="camera" size={16} /> Fotoğraf çek
            </button>
            <button type="button" className="iv-btn" onClick={stop}>
              Kamerayı kapat
            </button>
          </>
        )}
      </div>
      {error && <p className="iv-status iv-status--err" role="alert">{error}</p>}
      <div role="status" aria-live="polite" className={note ? "iv-status iv-status--ok" : "sr-only"}>{note}</div>
    </Sec>
  );
}

/* ----------------------------- Wishes ----------------------------- */

export function WishesSection() {
  const { theme, style } = useIv();
  const uid = useId();
  const key = `wishes:${theme.slug}`;
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{ name?: string; text?: string }>({});
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setWishes(getLocalJson<Wish[]>(key, []));
  }, [key]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: typeof errors = {};
    if (name.trim().length < 2) er.name = "Lütfen adınızı yazın.";
    if (text.trim().length < 3) er.text = "Dileğiniz en az 3 karakter olmalıdır.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const next = [{ name: name.trim(), text: text.trim(), at: new Date().toISOString() }, ...wishes];
    setWishes(next);
    setLocalJson(key, next);
    setName("");
    setText("");
    setOk(true);
    setTimeout(() => setOk(false), 2500);
  }

  const shown: Wish[] = [...wishes, ...SAMPLE.wishes.map((w) => ({ ...w, at: "" }))];

  return (
    <Sec id="dilekler" title="Dilekler">
      <p className="iv-kicker">Dilekleriniz</p>
      <Divider kind={style.ornament} />
      <form className="iv-form" onSubmit={submit} noValidate>
        <div className="iv-field">
          <label htmlFor={`${uid}-wn`} className="sr-only">Adınız</label>
          <input id={`${uid}-wn`} placeholder="Adınız" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} autoComplete="name" />
          {errors.name && <p className="iv-field__err">{errors.name}</p>}
        </div>
        <div className="iv-field">
          <label htmlFor={`${uid}-wt`} className="sr-only">Dileğiniz</label>
          <textarea id={`${uid}-wt`} rows={3} placeholder="Dileğiniz" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={Boolean(errors.text)} maxLength={300} />
          {errors.text && <p className="iv-field__err">{errors.text}</p>}
        </div>
        <button type="submit" className="iv-btn iv-btn--solid iv-btn--block">
          Dileğimi Gönder
        </button>
        <p role="status" aria-live="polite" className={ok ? "iv-status iv-status--ok" : "sr-only"}>
          {ok ? "Dileğiniz eklendi (yalnızca bu tarayıcıda)." : ""}
        </p>
      </form>
      <ul className="iv-wishes">
        {shown.map((w, i) => (
          <li key={`${w.name}-${i}`}>
            <strong>{w.name}</strong>
            <p>{w.text}</p>
          </li>
        ))}
      </ul>
    </Sec>
  );
}

/* ------------------------------ Gift ------------------------------ */

export function GiftSection() {
  const { data, style } = useIv();
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  const iban = formatIban(data.iban);

  async function copy() {
    const raw = data.iban.replace(/\s+/g, "");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(raw);
      } else {
        const ta = document.createElement("textarea");
        ta.value = raw;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const done = document.execCommand("copy");
        ta.remove();
        if (!done) throw new Error("copy");
      }
      setState("ok");
    } catch {
      setState("err");
    }
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <Sec id="hediye" title="Hediye / IBAN">
      <p className="iv-kicker">Hediye</p>
      <Divider kind={style.ornament} />
      <span className="iv-gift-icon"><Icon name="gift" size={30} /></span>
      <p className="iv-msg iv-msg--soft">Hediye göndermek isteyen sevdiklerimiz için hesap bilgilerimiz:</p>
      <p className="iv-holder">{data.ibanHolder}</p>
      <p className="iv-iban num" aria-label={`IBAN ${iban}`}>{iban}</p>
      <button type="button" className="iv-btn iv-btn--solid" onClick={copy}>
        <Icon name={state === "ok" ? "check" : "copy"} size={16} />
        {state === "ok" ? "Kopyalandı" : "IBAN'ı Kopyala"}
      </button>
      <p className="iv-note">Örnek IBAN: gerçek bir hesaba ait değildir.</p>
      <p role="status" aria-live="polite" className={state === "idle" ? "sr-only" : `iv-status iv-status--${state === "ok" ? "ok" : "err"}`}>
        {state === "ok" ? "IBAN panoya kopyalandı." : state === "err" ? "Kopyalanamadı; IBAN’ı elle seçip kopyalayın." : ""}
      </p>
    </Sec>
  );
}
