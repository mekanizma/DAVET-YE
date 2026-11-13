"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "../Icon";
import { TextField } from "../Field";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import { localizeError } from "@/i18n/product";
import { isEmail } from "@/lib/format";
import { isDesignStart, safeReturnPath } from "@/lib/returnTo";
import { authErrorMessage } from "@/lib/supabase/errors";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type Mode = "giris" | "kayit" | "sifre";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function withNext(path: string, next: string) {
  if (next === "/panel") return path;
  return `${path}?next=${encodeURIComponent(next)}`;
}

function copyFor(mode: Mode, locale: Locale) {
  if (mode === "giris") return { title: tx(locale, "Giriş yap", "Sign in"), cta: tx(locale, "Giriş yap", "Sign in"), busy: tx(locale, "Giriş yapılıyor…", "Signing in…") };
  if (mode === "kayit") return { title: tx(locale, "Hesap oluştur", "Create account"), cta: tx(locale, "Hesap oluştur", "Create account"), busy: tx(locale, "Hesap oluşturuluyor…", "Creating the account…") };
  return { title: tx(locale, "Şifremi unuttum", "Forgot password"), cta: tx(locale, "Bağlantı gönder", "Send the link"), busy: tx(locale, "Gönderiliyor…", "Sending…") };
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const locale = useLocale();
  return (
    <Suspense fallback={<div className="auth-card" aria-busy="true"><p className="muted">{tx(locale, "Yükleniyor…", "Loading…")}</p></div>}>
      <AuthFields mode={mode} />
    </Suspense>
  );
}

function AuthFields({ mode }: { mode: Mode }) {
  const locale = useLocale();
  const params = useSearchParams();
  const next = safeReturnPath(params.get("next"));
  const designing = isDesignStart(next.split("?")[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const copy = copyFor(mode, locale);

  useEffect(() => {
    const hata = new URLSearchParams(window.location.search).get("hata");
    if (hata === "dogrulama") setErrors({ form: tx(locale, "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Yeniden deneyin.", "The confirmation link is invalid or has expired. Please try again.") });
    const sync = () => {
      const emailEl = document.getElementById("a-email") as HTMLInputElement | null;
      const pwEl = document.getElementById("a-pw") as HTMLInputElement | null;
      if (emailEl?.value) setEmail(emailEl.value);
      if (pwEl?.value) setPw(pwEl.value);
    };
    sync();
    const timer = window.setTimeout(sync, 400);
    return () => window.clearTimeout(timer);
  }, [locale]);

  function fieldValue(id: string, fallback: string) {
    const el = document.getElementById(id) as HTMLInputElement | null;
    return el ? el.value : fallback;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nameNow = fieldValue("a-name", name);
    const emailNow = fieldValue("a-email", email);
    const pwNow = fieldValue("a-pw", pw);
    const pw2Now = fieldValue("a-pw2", pw2);
    setName(nameNow);
    setEmail(emailNow);
    setPw(pwNow);
    setPw2(pw2Now);
    const er: Record<string, string> = {};
    if (mode === "kayit" && nameNow.trim().length < 2) er.name = tx(locale, "Adınızı yazın.", "Enter your name.");
    if (!isEmail(emailNow.trim())) er.email = localizeError("Geçerli bir e-posta yazın.", locale);
    if (mode !== "sifre" && pwNow.length < 8) er.pw = localizeError("Şifre en az 8 karakter olmalı.", locale);
    if (mode === "kayit" && pw2Now !== pwNow) er.pw2 = tx(locale, "Şifreler eşleşmiyor.", "The passwords do not match.");
    setErrors(er);
    setInfo("");
    if (Object.keys(er).length) return;

    setBusy(true);
    try {
      const supabase = createSupabaseBrowser();
      const origin = window.location.origin;
      if (mode === "sifre") {
        const { error } = await supabase.auth.resetPasswordForEmail(emailNow.trim().toLowerCase(), {
          redirectTo: `${origin}/auth/callback?next=/panel/sifre-yenile`,
        });
        if (error) {
          setErrors({ form: authErrorMessage(error.message, locale) });
          return;
        }
        setInfo(tx(locale, "Hesap varsa sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzu ve istenmeyen klasörünü kontrol edin.", "If an account exists, a reset link has been sent to your email. Check your inbox and the spam folder."));
        return;
      }
      if (mode === "kayit") {
        const { data, error } = await supabase.auth.signUp({
          email: emailNow.trim().toLowerCase(),
          password: pwNow,
          options: {
            data: { full_name: nameNow.trim() },
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) {
          setErrors({ form: authErrorMessage(error.message, locale) });
          return;
        }
        if (!data.session) {
          setInfo(tx(locale, "Hesabınız oluşturuldu. Giriş yapmadan önce e-postanızdaki doğrulama bağlantısına tıklayın.", "Your account has been created. Before you sign in, open the confirmation link in your email."));
          return;
        }
        window.location.assign(next);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: emailNow.trim().toLowerCase(),
        password: pwNow,
      });
      if (error) {
        setErrors({ form: authErrorMessage(error.message, locale) });
        return;
      }
      window.location.assign(next);
      return;
    } catch (err) {
      setErrors({ form: authErrorMessage(err instanceof Error ? err.message : "network", locale) });
    } finally {
      setBusy(false);
    }
  }

  const lead = designing && mode === "kayit"
    ? tx(locale, "Tasarıma başlamak için hesap oluşturun. Hesabınız varsa giriş yapın.", "Create an account to start designing. If you already have one, sign in.")
    : designing && mode === "giris"
      ? tx(locale, "Tasarıma başlamak için giriş yapın. Hesabınız yoksa kayıt olabilirsiniz.", "Sign in to start designing. If you do not have an account, you can create one.")
      : mode === "kayit"
        ? tx(locale, "Davetiyeleriniz ve siparişleriniz bu hesapta durur.", "Your invitations and orders stay on this account.")
        : mode === "sifre"
          ? tx(locale, "Kayıtlı e-postanıza şifre sıfırlama bağlantısı gönderilir.", "A password reset link is sent to the email you registered with.")
          : tx(locale, "Kayıt olduğunuz e-posta ve şifreyle devam edin.", "Continue with the email and password you registered with.");

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <h1>{copy.title}</h1>
      <p className="muted" style={{ margin: "0 0 16px" }}>{lead}</p>

      {mode === "kayit" && (
        <TextField id="a-name" name="name" label={tx(locale, "Ad soyad", "Full name")} required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
      )}
      <TextField id="a-email" name="email" type="email" label={tx(locale, "E-posta", "Email")} required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete={mode === "giris" ? "username" : "email"} inputMode="email" />
      {mode !== "sifre" && (
        <div className="field-pw">
          <TextField id="a-pw" name="password" type={show ? "text" : "password"} label={tx(locale, "Şifre", "Password")} required value={pw} onChange={(e) => setPw(e.target.value)} error={errors.pw} autoComplete={mode === "kayit" ? "new-password" : "current-password"} />
          <label className="check check--sm">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            <span>{show ? tx(locale, "Şifreyi gizle", "Hide password") : tx(locale, "Şifreyi göster", "Show password")}</span>
          </label>
        </div>
      )}
      {mode === "kayit" && (
        <TextField id="a-pw2" name="password-confirm" type={show ? "text" : "password"} label={tx(locale, "Şifre (tekrar)", "Password (again)")} required value={pw2} onChange={(e) => setPw2(e.target.value)} error={errors.pw2} autoComplete="new-password" />
      )}

      {errors.form && (
        <p className="alert alert--error" role="alert">
          <Icon name="info" size={18} />
          <span>{errors.form}</span>
        </p>
      )}
      {info && <p className="alert alert--success" role="status">{info}</p>}

      <button type="submit" className="btn btn--dark btn--lg btn--block btn--serif" disabled={busy} aria-busy={busy}>
        {busy ? copy.busy : copy.cta}
      </button>

      <p className="auth-card__links">
        {mode === "giris" && (
          <>
            <Link href={withNext("/panel/sifremi-unuttum", next)}>{tx(locale, "Şifremi unuttum", "Forgot password")}</Link>
            <span>{tx(locale, "Hesabınız yok mu?", "No account yet?")} <Link href={withNext("/panel/kayit", next)}>{tx(locale, "Kayıt olun", "Create one")}</Link></span>
          </>
        )}
        {mode === "kayit" && <span>{tx(locale, "Zaten hesabınız var mı?", "Already have an account?")} <Link href={withNext("/panel/giris", next)}>{tx(locale, "Giriş yapın", "Sign in")}</Link></span>}
        {mode === "sifre" && <Link href={withNext("/panel/giris", next)}>{tx(locale, "Girişe dön", "Back to sign in")}</Link>}
      </p>
    </form>
  );
}
