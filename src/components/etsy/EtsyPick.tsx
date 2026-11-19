"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { lp } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";

type Opt = { slug: string; title: string; titleEn: string };

export default function EtsyPick() {
  const locale = useLocale();
  const en = locale === "en";
  const router = useRouter();
  const [kind, setKind] = useState<"gazete" | "davetiye">("gazete");
  const [options, setOptions] = useState<Opt[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/etsy/sec")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d?.ok) {
          router.replace(lp(locale, "/etsy"));
          return;
        }
        if (d.locked) {
          router.replace(lp(locale, "/etsy/tasarla"));
          return;
        }
        setKind(d.kind === "davetiye" ? "davetiye" : "gazete");
        setOptions(Array.isArray(d.options) ? d.options : []);
      })
      .catch(() => router.replace(lp(locale, "/etsy")))
      .finally(() => setLoading(false));
  }, [locale, router]);

  async function pick(slug: string) {
    setBusy(slug);
    setError("");
    try {
      const res = await fetch("/api/etsy/sec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || (en ? "Could not lock this design." : "Seçim kaydedilemedi."));
        return;
      }
      router.push(lp(locale, "/etsy/tasarla"));
    } catch {
      setError(en ? "Network error." : "Bağlantı hatası.");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div className="etsy-gate">
        <div className="etsy-gate__card">
          <p role="status">{en ? "Loading…" : "Yükleniyor…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="etsy-gate">
      <div className="etsy-gate__card etsy-pick">
        <p className="etsy-gate__brand">Davetanisi</p>
        <h1>
          {kind === "davetiye"
            ? en ? "Choose your free invitation" : "Ücretsiz davetiyenizi seçin"
            : en ? "Choose your free newspaper" : "Ücretsiz gazetenizi seçin"}
        </h1>
        <p className="etsy-gate__lead">
          {en
            ? "Your code unlocks one free design of this type. Pick one — it locks to your code."
            : "Kodunuz bu tipte 1 ücretsiz tasarım açar. Birini seçin; seçim kodunuza kilitlenir."}
        </p>
        {error ? <p className="field__error" role="alert">{error}</p> : null}
        <ul className="etsy-pick__list">
          {options.map((o) => (
            <li key={o.slug}>
              <button
                type="button"
                className="etsy-pick__btn"
                disabled={Boolean(busy)}
                aria-busy={busy === o.slug}
                onClick={() => pick(o.slug)}
              >
                <span>
                  <strong>{en ? o.titleEn : o.title}</strong>
                  <small>{en ? o.title : o.titleEn}</small>
                </span>
                <Icon name="arrow" size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
