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
  const [session, setSession] = useState<{ slug: string; title: string; code: string } | null>(null);

  useEffect(() => {
    fetch("/api/etsy/oturum")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setSession({ slug: d.slug, title: d.title, code: d.code });
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
      router.push(lp(locale, "/etsy/tasarla"));
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
        <h1>{en ? "Etsy newspaper access" : "Etsy gazete erişimi"}</h1>
        <p className="etsy-gate__lead">
          {en
            ? "Enter the access code from your PDF download to open the studio, design your newspaper, and print or save it."
            : "PDF’deki erişim kodunu girin; stüdyoda gazetenizi tasarlayıp yazdırın veya kaydedin."}
        </p>

        {session ? (
          <div className="etsy-gate__session">
            <p>
              <strong>{session.title}</strong>
              <br />
              <span className="etsy-gate__code">{session.code}</span>
            </p>
            <Link href={lp(locale, "/etsy/tasarla")} className="btn btn--dark btn--lg btn--block">
              {en ? "Continue designing" : "Tasarıma devam et"}
            </Link>
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
          {en ? "Bought on Etsy? The code is inside your PDF file." : "Etsy’den mi aldınız? Kod PDF dosyanızın içinde."}
        </p>
      </div>
    </div>
  );
}
