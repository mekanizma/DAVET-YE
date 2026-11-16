"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Icon from "./Icon";
import { useLocale } from "@/i18n/provider";
import { isEmail } from "@/lib/format";

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "message", string>>;

export default function SupportWidget() {
  const en = useLocale() === "en";
  const panelId = useId();
  const titleId = useId();
  const firstRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [storeError, setStoreError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const text = en
    ? {
        open: "Support",
        close: "Close support",
        title: "How can we help?",
        lead: "Leave your details — we will get back to you.",
        firstName: "First name",
        lastName: "Last name",
        email: "Email",
        message: "Your request",
        send: "Send request",
        saving: "Sending…",
        again: "Send another",
        thanks: "Thank you!",
        thanksBody: "Your support request was received. We will reply as soon as we can.",
        errFirst: "Please enter your first name.",
        errLast: "Please enter your last name.",
        errEmail: "Please enter a valid email.",
        errMessage: "Please write a short request (at least 5 characters).",
        fail: "Could not send. Please try again.",
      }
    : {
        open: "Destek",
        close: "Desteği kapat",
        title: "Size nasıl yardımcı olalım?",
        lead: "Bilgilerinizi bırakın, en kısa sürede dönelim.",
        firstName: "Ad",
        lastName: "Soyad",
        email: "E-posta",
        message: "Talebiniz",
        send: "Talebi gönder",
        saving: "Gönderiliyor…",
        again: "Yeni talep",
        thanks: "Teşekkürler!",
        thanksBody: "Destek talebiniz alındı. En kısa sürede size döneceğiz.",
        errFirst: "Lütfen adınızı yazın.",
        errLast: "Lütfen soyadınızı yazın.",
        errEmail: "Geçerli bir e-posta yazın.",
        errMessage: "Talebiniz en az 5 karakter olmalı.",
        fail: "Gönderilemedi. Lütfen tekrar deneyin.",
      };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => firstRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const next: Errors = {};
    if (firstName.trim().length < 1) next.firstName = text.errFirst;
    if (lastName.trim().length < 1) next.lastName = text.errLast;
    if (!isEmail(email.trim())) next.email = text.errEmail;
    if (message.trim().length < 5) next.message = text.errMessage;
    setErrors(next);
    setStoreError("");
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/destek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          message: message.trim(),
          source: "widget",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok || !data.id) throw new Error(data.error || text.fail);
      setSent(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setMessage("");
      setErrors({});
    } catch (err) {
      setStoreError(err instanceof Error ? err.message : text.fail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`sup-fab${open ? " is-open" : ""}`}>
      {open ? (
        <section
          id={panelId}
          className="sup-fab__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="sup-fab__head">
            <div className="sup-fab__avatar" aria-hidden="true">
              <Icon name="whatsapp" size={22} />
            </div>
            <div>
              <h2 id={titleId}>{text.title}</h2>
              <p>{text.lead}</p>
            </div>
            <button
              type="button"
              className="sup-fab__x"
              aria-label={text.close}
              onClick={() => setOpen(false)}
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          {sent ? (
            <div className="sup-fab__thanks" role="status">
              <Icon name="check" size={28} />
              <strong>{text.thanks}</strong>
              <p>{text.thanksBody}</p>
              <button
                type="button"
                className="sup-fab__submit"
                onClick={() => setSent(false)}
              >
                {text.again}
              </button>
            </div>
          ) : (
            <form className="sup-fab__form" onSubmit={onSubmit} noValidate>
              <div className="sup-fab__row">
                <label className="sup-fab__field">
                  <span>{text.firstName}</span>
                  <input
                    ref={firstRef}
                    name="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    aria-invalid={Boolean(errors.firstName)}
                    disabled={busy}
                  />
                  {errors.firstName ? <em role="alert">{errors.firstName}</em> : null}
                </label>
                <label className="sup-fab__field">
                  <span>{text.lastName}</span>
                  <input
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    aria-invalid={Boolean(errors.lastName)}
                    disabled={busy}
                  />
                  {errors.lastName ? <em role="alert">{errors.lastName}</em> : null}
                </label>
              </div>
              <label className="sup-fab__field">
                <span>{text.email}</span>
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  disabled={busy}
                />
                {errors.email ? <em role="alert">{errors.email}</em> : null}
              </label>
              <label className="sup-fab__field">
                <span>{text.message}</span>
                <textarea
                  name="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  disabled={busy}
                  maxLength={2000}
                />
                {errors.message ? <em role="alert">{errors.message}</em> : null}
              </label>
              {storeError ? <p className="sup-fab__err" role="alert">{storeError}</p> : null}
              <button type="submit" className="sup-fab__submit" disabled={busy}>
                {busy ? text.saving : text.send}
              </button>
            </form>
          )}
        </section>
      ) : null}

      <button
        type="button"
        className="sup-fab__btn"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? text.close : text.open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sup-fab__pulse" aria-hidden="true" />
        <span className="sup-fab__pulse sup-fab__pulse--late" aria-hidden="true" />
        <span className="sup-fab__icon">
          <Icon name={open ? "close" : "whatsapp"} size={open ? 22 : 28} />
        </span>
        {!open ? <span className="sup-fab__label">{text.open}</span> : null}
      </button>
    </div>
  );
}
