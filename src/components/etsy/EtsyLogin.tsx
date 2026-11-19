"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { lp } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";

export default function EtsyLogin() {
  const locale = useLocale();
  const en = locale === "en";
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<{ slug: string; title: string; code: string; kind: "gazete" | "davetiye" | "any" } | null>(null);

  useEffect(() => {
    fetch("/api/etsy/oturum")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok) return;
        const kind = d.kind === "davetiye" ? "davetiye" : d.kind === "any" ? "any" : "gazete";
        setSession({ slug: d.slug, title: d.title, code: d.code, kind });
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/etsy/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || (en ? "Could not sign in." : "Giriş yapılamadı."));
        return;
      }
      // Always open the picker route first (Gazeteler / Davetiyeler).
      // Locked codes are forwarded to the studio by /etsy/sec itself.
      window.location.assign(lp(locale, "/etsy/sec"));
    } catch {
      setError(en ? "Network error. Try again." : "Bağlantı hatası. Yeniden deneyin.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/etsy/cikis", { method: "POST" });
    setSession(null);
  }

  return (
    <div className="etsy-gate">
      <div className="etsy-gate__card">
        <p className="etsy-gate__brand">Davetanisi</p>
        <h1>{en ? "Your free Etsy product" : "Ücretsiz Etsy ürününüz"}</h1>
        <p className="etsy-gate__lead">
          {en
            ? "Enter the access code from your PDF. It unlocks one free newspaper or invitation: design it, then download or share — no payment on this site."
            : "PDF’deki erişim kodunu girin. Kod 1 ücretsiz gazete veya davetiye açar: tasarlayın, sonra indirin veya paylaşın — sitede ödeme yok."}
        </p>

        {session ? (
          <div className="etsy-gate__session">
            <p>
              <strong>{session.title}</strong>
              <br />
              <span className="etsy-gate__code">{session.code}</span>
            </p>
            {session.kind === "any" || session.slug === "__any__" ? (
              <div className="etsy-pick__kinds">
                <Link href={`${lp(locale, "/etsy/sec")}?tip=gazete`} className="etsy-pick__kind">
                  <strong>{en ? "Newspapers" : "Gazeteler"}</strong>
                  <small>{en ? "Then pick one free design" : "Sonra 1 ücretsiz tasarım seçin"}</small>
                  <Icon name="arrow" size={16} />
                </Link>
                <Link href={`${lp(locale, "/etsy/sec")}?tip=davetiye`} className="etsy-pick__kind">
                  <strong>{en ? "Invitations" : "Davetiyeler"}</strong>
                  <small>{en ? "Then pick one free design" : "Sonra 1 ücretsiz tasarım seçin"}</small>
                  <Icon name="arrow" size={16} />
                </Link>
              </div>
            ) : (
              <Link href={lp(locale, "/etsy/tasarla")} className="btn btn--dark btn--lg btn--block">
                {session.kind === "davetiye"
                  ? en ? "Continue invitation" : "Davetiyeye devam et"
                  : en ? "Continue newspaper" : "Gazeteye devam et"}
              </Link>
            )}
            <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
              {en ? "Sign out of this code" : "Bu koddan çık"}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="etsy-gate__form">
            <label className="field">
              <span className="field__label">{en ? "Access code" : "Erişim kodu"}</span>
              <input
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ETSY-XXXXXXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                inputMode="text"
              />
            </label>
            {error ? (
              <p className="field__error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn--dark btn--lg btn--block" disabled={busy}>
              <Icon name="lock" size={16} />
              {busy ? (en ? "Checking…" : "Kontrol…") : en ? "Open studio" : "Stüdyoyu aç"}
            </button>
          </form>
        )}

        <p className="etsy-gate__foot">
          {en
            ? "Bought on Etsy? One code = one free product (newspaper or invitation). The code is inside your PDF."
            : "Etsy’den mi aldınız? Bir kod = bir ücretsiz ürün (gazete veya davetiye). Kod PDF dosyanızın içinde."}
        </p>
      </div>
    </div>
  );
}
