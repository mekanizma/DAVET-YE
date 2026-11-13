"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAccount } from "@/components/panel/account";
import { useLocale } from "@/i18n/provider";

export default function Page() {
  const locale = useLocale();
  const en = locale === "en";
  const { account, failed } = useAccount();

  useEffect(() => {
    document.title = en ? "Account · Panel · Davetanisi" : "Hesap · Panel · Davetanisi";
  }, [en]);

  if (!account && !failed) return <p className="wz-loading" role="status">{en ? "Loading…" : "Yükleniyor…"}</p>;
  if (!account) {
    return (
      <div className="dash__card">
        <h1>{en ? "Account" : "Hesap"}</h1>
        <p>{en ? "We couldn’t load the account." : "Hesap bilgisi alınamadı."}</p>
        <Link href="/panel/giris" className="btn btn--dark btn--lg btn--block">{en ? "Sign in" : "Giriş yap"}</Link>
      </div>
    );
  }

  async function logout() {
    await fetch("/api/hesap", { method: "DELETE" });
    window.location.assign("/panel/giris");
  }

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <p className="eyebrow">{en ? "Account" : "Hesap"}</p>
          <h1>{account.name.trim() || (en ? "Your account" : "Hesabınız")}</h1>
        </div>
      </header>
      <section className="dash__card">
        <dl className="desk-facts">
          <div>
            <dt>{en ? "Full name" : "Ad soyad"}</dt>
            <dd>{account.name.trim() || "—"}</dd>
          </div>
          <div>
            <dt>{en ? "Email" : "E-posta"}</dt>
            <dd>{account.email}</dd>
          </div>
          <div>
            <dt>{en ? "Password" : "Şifre"}</dt>
            <dd><Link href="/panel/sifremi-unuttum">{en ? "Request a password reset link" : "Şifre sıfırlama bağlantısı iste"}</Link></dd>
          </div>
        </dl>
        <div className="dash__row">
          <button type="button" className="btn btn--dark btn--sm" onClick={logout}>{en ? "Sign out" : "Çıkış yap"}</button>
          <Link href={`/${locale}`} className="btn btn--outline btn--sm">{en ? "Back to the site" : "Siteye dön"}</Link>
        </div>
      </section>
    </div>
  );
}
