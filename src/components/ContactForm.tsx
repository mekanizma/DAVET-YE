"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/provider";
import { isEmail } from "@/lib/format";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

export default function ContactForm() {
  const en = useLocale() === "en";
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const text = {
    name: en ? "Your name" : "Adınız",
    email: en ? "Email" : "E-posta",
    message: en ? "Your message" : "Mesajınız",
    send: en ? "Send" : "Gönder",
    again: en ? "Write another message" : "Yeni mesaj yaz",
    errName: en ? "Please enter your name." : "Lütfen adınızı yazın.",
    errEmail: en ? "Please enter a valid email address." : "Geçerli bir e-posta adresi yazın.",
    errMessage: en ? "Your message must be at least 10 characters." : "Mesajınız en az 10 karakter olmalı.",
  };

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    const next: Errors = {};
    if (name.length < 2) next.name = text.errName;
    if (!isEmail(email)) next.email = text.errEmail;
    if (message.length < 10) next.message = text.errMessage;
    setErrors(next);
    if (Object.keys(next).length === 0) {
      // Local-only: no network request is made in this copy.
      setSent(true);
      e.currentTarget.reset();
    }
  }

  if (sent) {
    return (
      <div className="alert alert--success" role="status">
        <strong>{en ? "Your message was received (sample)." : "Mesajınız alındı (örnek)."}</strong>{" "}
        {en
          ? "In this local copy the message is not sent anywhere; on the live site we reply as soon as we can."
          : "Bu yerel kopyada mesaj bir yere gönderilmez; gerçek yayında en kısa sürede dönüş yapılır."}
        <div>
          <button type="button" className="link-btn" onClick={() => setSent(false)}>{text.again}</button>
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="field__label" htmlFor="c-name">{text.name}</label>
        <input id="c-name" name="name" className="input" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-e" : undefined} />
        {errors.name && <p id="c-name-e" className="field__error" role="alert">{errors.name}</p>}
      </div>
      <div className="field">
        <label className="field__label" htmlFor="c-email">{text.email}</label>
        <input id="c-email" name="email" type="email" inputMode="email" className="input" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-e" : undefined} />
        {errors.email && <p id="c-email-e" className="field__error" role="alert">{errors.email}</p>}
      </div>
      <div className="field">
        <label className="field__label" htmlFor="c-msg">{text.message}</label>
        <textarea id="c-msg" name="message" rows={5} className="textarea" aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-msg-e" : undefined} />
        {errors.message && <p id="c-msg-e" className="field__error" role="alert">{errors.message}</p>}
      </div>
      <button type="submit" className="btn btn--dark btn--lg btn--block">{text.send}</button>
    </form>
  );
}
