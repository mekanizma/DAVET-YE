"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "../Icon";
import { TextField } from "../Field";
import { isEmail } from "@/lib/format";
import { isDesignStart, safeReturnPath } from "@/lib/returnTo";
import { authErrorMessage } from "@/lib/supabase/errors";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type Mode = "giris" | "kayit" | "sifre";

function withNext(path: string, next: string) {
  if (next === "/panel") return path;
  return `${path}?next=${encodeURIComponent(next)}`;
}

const COPY: Record<Mode, { title: string; cta: string; busy: string }> = {
  giris: { title: "Giriş yap", cta: "Giriş yap", busy: "Giriş yapılıyor…" },
  kayit: { title: "Hesap oluştur", cta: "Hesap oluştur", busy: "Hesap oluşturuluyor…" },
  sifre: { title: "Şifremi unuttum", cta: "Bağlantı gönder", busy: "Gönderiliyor…" },
};

export default function AuthForm({ mode }: { mode: Mode }) {
  return (
    <Suspense fallback={<div className="auth-card" aria-busy="true"><p className="muted">Yükleniyor…</p></div>}>
      <AuthFields mode={mode} />
    </Suspense>
  );
}

function AuthFields({ mode }: { mode: Mode }) {
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

  useEffect(() => {
    const hata = new URLSearchParams(window.location.search).get("hata");
    if (hata === "dogrulama") setErrors({ form: "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Yeniden deneyin." });
    const sync = () => {
      const emailEl = document.getElementById("a-email") as HTMLInputElement | null;
      const pwEl = document.getElementById("a-pw") as HTMLInputElement | null;
      if (emailEl?.value) setEmail(emailEl.value);
      if (pwEl?.value) setPw(pwEl.value);
    };
    sync();
    const timer = window.setTimeout(sync, 400);
    return () => window.clearTimeout(timer);
  }, []);

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
    if (mode === "kayit" && nameNow.trim().length < 2) er.name = "Adınızı yazın.";
    if (!isEmail(emailNow.trim())) er.email = "Geçerli bir e-posta adresi yazın.";
    if (mode !== "sifre" && pwNow.length < 8) er.pw = "Şifre en az 8 karakter olmalı.";
    if (mode === "kayit" && pw2Now !== pwNow) er.pw2 = "Şifreler eşleşmiyor.";
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
          setErrors({ form: authErrorMessage(error.message) });
          return;
        }
        setInfo("Hesap varsa sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzu ve istenmeyen klasörünü kontrol edin.");
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
          setErrors({ form: authErrorMessage(error.message) });
          return;
        }
        if (!data.session) {
          setInfo("Hesabınız oluşturuldu. Giriş yapmadan önce e-postanızdaki doğrulama bağlantısına tıklayın.");
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
        setErrors({ form: authErrorMessage(error.message) });
        return;
      }
      window.location.assign(next);
      return;
    } catch (err) {
      setErrors({ form: authErrorMessage(err instanceof Error ? err.message : "network") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <h1>{COPY[mode].title}</h1>
      <p className="muted" style={{ margin: "0 0 16px" }}>
        {designing && mode === "kayit"
          ? "Tasarıma başlamak için hesap oluşturun. Hesabınız varsa giriş yapın."
          : designing && mode === "giris"
            ? "Tasarıma başlamak için giriş yapın. Hesabınız yoksa kayıt olabilirsiniz."
            : mode === "kayit"
              ? "Davetiyeleriniz ve siparişleriniz bu hesapta durur."
              : mode === "sifre"
                ? "Kayıtlı e-postanıza şifre sıfırlama bağlantısı gönderilir."
                : "Kayıt olduğunuz e-posta ve şifreyle devam edin."}
      </p>

      {mode === "kayit" && (
        <TextField id="a-name" name="name" label="Ad soyad" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
      )}
      <TextField id="a-email" name="email" type="email" label="E-posta" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete={mode === "giris" ? "username" : "email"} inputMode="email" />
      {mode !== "sifre" && (
        <div className="field-pw">
          <TextField id="a-pw" name="password" type={show ? "text" : "password"} label="Şifre" required value={pw} onChange={(e) => setPw(e.target.value)} error={errors.pw} autoComplete={mode === "kayit" ? "new-password" : "current-password"} />
          <label className="check check--sm">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            <span>Şifreyi göster</span>
          </label>
        </div>
      )}
      {mode === "kayit" && (
        <TextField id="a-pw2" name="password-confirm" type={show ? "text" : "password"} label="Şifre (tekrar)" required value={pw2} onChange={(e) => setPw2(e.target.value)} error={errors.pw2} autoComplete="new-password" />
      )}

      {errors.form && (
        <p className="alert alert--error" role="alert">
          <Icon name="info" size={18} />
          <span>{errors.form}</span>
        </p>
      )}
      {info && <p className="alert alert--success" role="status">{info}</p>}

      <button type="submit" className="btn btn--dark btn--lg btn--block btn--serif" disabled={busy} aria-busy={busy}>
        {busy ? COPY[mode].busy : COPY[mode].cta}
      </button>

      <p className="auth-card__links">
        {mode === "giris" && (
          <>
            <Link href={withNext("/panel/sifremi-unuttum", next)}>Şifremi unuttum</Link>
            <span>Hesabınız yok mu? <Link href={withNext("/panel/kayit", next)}>Kayıt olun</Link></span>
          </>
        )}
        {mode === "kayit" && <span>Zaten hesabınız var mı? <Link href={withNext("/panel/giris", next)}>Giriş yapın</Link></span>}
        {mode === "sifre" && <Link href={withNext("/panel/giris", next)}>Girişe dön</Link>}
      </p>
    </form>
  );
}
