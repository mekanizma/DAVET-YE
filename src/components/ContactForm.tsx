"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/provider";
import { isEmail } from "@/lib/format";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

export default function ContactForm() {
  const en = useLocale() === "en";
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [storeError, setStoreError] = useState("");
  const text = {
    name: en ? "Your name" : "Adınız Soyadınız",
    email: en ? "Email" : "E-posta",
    message: en ? "Your message" : "Mesajınız",
    send: en ? "Send" : "Gönder",
    saving: en ? "Sending…" : "Gönderiliyor…",
    again: en ? "Write another message" : "Yeni mesaj yaz",
    errName: en ? "Please enter your name." : "Lütfen adınızı yazın.",
    errEmail: en ? "Please enter a valid email address." : "Geçerli bir e-posta adresi yazın.",
    errMessage: en ? "Your message must be at least 10 characters." : "Mesajınız en az 10 karakter olmalı.",
    fail: en ? "Could not send. Please try again." : "Gönderilemedi. Lütfen tekrar deneyin.",
    ok: en ? "Your message was received." : "Mesajınız alındı.",
    okBody: en
      ? "We will reply as soon as we can."
      : "En kısa sürede dönüş yapılır.",
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    const next: Errors = {};
    if (name.length < 2) next.name = text.errName;
    if (!isEmail(email)) next.email = text.errEmail;
    if (message.length < 10) next.message = text.errMessage;
    setErrors(next);
    setStoreError("");
    if (Object.keys(next).length) return;

    const parts = name.split(/\s+/);
    const firstName = parts[0] || name;
    const lastName = parts.slice(1).join(" ") || firstName;

    setBusy(true);
    try {
      const res = await fetch("/api/destek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, message, source: "page" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok || !data.id) throw new Error(data.error || text.fail);
      setSent(true);
      e.currentTarget.reset();
    } catch (err) {
      setStoreError(err instanceof Error ? err.message : text.fail);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="alert alert--success" role="status">
        <strong>{text.ok}</strong> {text.okBody}
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
        <input id="c-name" name="name" className="input" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-e" : undefined} disabled={busy} />
        {errors.name && <p id="c-name-e" className="field__error" role="alert">{errors.name}</p>}
      </div>
      <div className="field">
        <label className="field__label" htmlFor="c-email">{text.email}</label>
        <input id="c-email" name="email" type="email" inputMode="email" className="input" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-e" : undefined} disabled={busy} />
        {errors.email && <p id="c-email-e" className="field__error" role="alert">{errors.email}</p>}
      </div>
      <div className="field">
        <label className="field__label" htmlFor="c-msg">{text.message}</label>
        <textarea id="c-msg" name="message" rows={5} className="textarea" aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-msg-e" : undefined} disabled={busy} />
        {errors.message && <p id="c-msg-e" className="field__error" role="alert">{errors.message}</p>}
      </div>
      {storeError ? <p className="field__error" role="alert">{storeError}</p> : null}
      <button type="submit" className="btn btn--dark btn--lg btn--block" disabled={busy}>
        {busy ? text.saving : text.send}
      </button>
    </form>
  );
}
