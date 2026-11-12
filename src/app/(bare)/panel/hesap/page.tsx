"use client";

import Link from "next/link";
import { useAccount } from "@/components/panel/account";

export default function Page() {
  const { account, failed } = useAccount();
  if (!account && !failed) return <p className="wz-loading" role="status">Yükleniyor…</p>;
  if (!account) {
    return (
      <div className="dash__card">
        <h1>Hesap</h1>
        <p>Hesap bilgisi alınamadı.</p>
        <Link href="/panel/giris" className="btn btn--dark btn--lg btn--block">Giriş yap</Link>
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
          <p className="eyebrow">Hesap</p>
          <h1>{account.name.trim() || "Hesabınız"}</h1>
        </div>
      </header>
      <section className="dash__card">
        <dl className="desk-facts">
          <div>
            <dt>Ad soyad</dt>
            <dd>{account.name.trim() || "—"}</dd>
          </div>
          <div>
            <dt>E-posta</dt>
            <dd>{account.email}</dd>
          </div>
          <div>
            <dt>Şifre</dt>
            <dd><Link href="/panel/sifremi-unuttum">Şifre sıfırlama bağlantısı iste</Link></dd>
          </div>
        </dl>
        <div className="dash__row">
          <button type="button" className="btn btn--dark btn--sm" onClick={logout}>Çıkış yap</button>
          <Link href="/tr" className="btn btn--outline btn--sm">Siteye dön</Link>
        </div>
      </section>
    </div>
  );
}
