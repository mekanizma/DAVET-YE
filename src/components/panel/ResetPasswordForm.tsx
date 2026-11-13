"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { TextField } from "../Field";
import { useLocale } from "@/i18n/provider";
import { localizeError } from "@/i18n/product";
import { authErrorMessage } from "@/lib/supabase/errors";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function ResetPasswordForm() {
  const locale = useLocale();
  const en = locale === "en";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) {
      setError(localizeError("Şifre en az 8 karakter olmalı.", locale));
      return;
    }
    if (pw !== pw2) {
      setError(en ? "The passwords do not match." : "Şifreler eşleşmiyor.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(en ? "The reset link has expired. Request a new one." : "Sıfırlama bağlantısının süresi dolmuş. Yeni bir bağlantı isteyin.");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: pw });
      if (updateError) {
        setError(authErrorMessage(updateError.message, locale));
        return;
      }
      setInfo(en ? "Your password has been updated." : "Şifreniz güncellendi.");
      window.location.assign("/panel");
      return;
    } catch (err) {
      setError(authErrorMessage(err instanceof Error ? err.message : "network", locale));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <h1>{en ? "New password" : "Yeni şifre"}</h1>
      <p className="muted" style={{ margin: "0 0 16px" }}>{en ? "After you arrive from the link in the email, choose a new password." : "E-postadaki bağlantıyla geldikten sonra yeni şifrenizi belirleyin."}</p>
      <div className="field-pw">
        <TextField id="n-pw" type={show ? "text" : "password"} label={en ? "New password" : "Yeni şifre"} required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" error={error} />
        <label className="check check--sm">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          <span>{show ? (en ? "Hide password" : "Şifreyi gizle") : (en ? "Show password" : "Şifreyi göster")}</span>
        </label>
      </div>
      <TextField id="n-pw2" type={show ? "text" : "password"} label={en ? "New password (again)" : "Yeni şifre (tekrar)"} required value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
      {info && <p className="alert alert--success" role="status">{info}</p>}
      <button type="submit" className="btn btn--dark btn--lg btn--block btn--serif" disabled={busy} aria-busy={busy}>
        {busy ? (en ? "Saving…" : "Kaydediliyor…") : (en ? "Save password" : "Şifreyi kaydet")}
      </button>
      <p className="auth-card__links">
        <Link href="/panel/sifremi-unuttum">{en ? "Request a new link" : "Yeni bağlantı iste"}</Link>
        <Link href="/panel/giris">{en ? "Back to sign in" : "Girişe dön"}</Link>
      </p>
    </form>
  );
}
