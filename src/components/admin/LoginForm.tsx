"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { TextField } from "../Field";
import { isEmail } from "@/lib/format";

export default function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => {
      const emailEl = document.getElementById("adm-email") as HTMLInputElement | null;
      const pwEl = document.getElementById("adm-pw") as HTMLInputElement | null;
      if (emailEl?.value) setEmail(emailEl.value);
      if (pwEl?.value) setPassword(pwEl.value);
    };
    sync();
    const timer = window.setTimeout(sync, 400);
    return () => window.clearTimeout(timer);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const emailNow = (document.getElementById("adm-email") as HTMLInputElement | null)?.value ?? email;
    const passwordNow = (document.getElementById("adm-pw") as HTMLInputElement | null)?.value ?? password;
    setEmail(emailNow);
    setPassword(passwordNow);
    if (!isEmail(emailNow.trim())) {
      setError("Geçerli bir e-posta yazın.");
      return;
    }
    if (passwordNow.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setBusy(true);
    setError("");
    let entered = false;
    try {
      const res = await fetch("/api/yonetim/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNow.trim().toLowerCase(), password: passwordNow }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Giriş yapılamadı.");
        return;
      }
      const next = params.get("next") || "/yonetim";
      const dest = next.startsWith("/yonetim") && !next.startsWith("//") ? next : "/yonetim";
      entered = true;
      window.location.assign(dest);
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      if (!entered) setBusy(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <p className="eyebrow">Yönetim</p>
      <h1>Panele girin</h1>
      <p className="muted" style={{ margin: "6px 0 16px" }}>
        Fiyatlar, şablonlar, gazeteler ve havale onayları bu hesapla yönetilir. Müşteri paneli ayrıdır.
      </p>
      <TextField
        id="adm-email"
        name="email"
        type="email"
        label="E-posta"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        inputMode="email"
      />
      <TextField
        id="adm-pw"
        name="password"
        type={show ? "text" : "password"}
        label="Şifre"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        error={error}
      />
      <label className="check check--sm">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        <span>Şifreyi göster</span>
      </label>
      <button type="submit" className="btn btn--dark btn--lg btn--block btn--serif" disabled={busy} aria-busy={busy}>
        {busy ? "Kontrol ediliyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
