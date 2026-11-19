"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { lp } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";

type Opt = { slug: string; title: string; titleEn: string };
type LockedKind = "gazete" | "davetiye";

function asKind(value: string | null): LockedKind | null {
  if (value === "davetiye" || value === "gazete") return value;
  return null;
}

export default function EtsyPick() {
  const locale = useLocale();
  const en = locale === "en";
  const router = useRouter();
  const search = useSearchParams();
  const [kind, setKind] = useState<LockedKind | null>(() => asKind(search.get("tip")));
  const [gazete, setGazete] = useState<Opt[]>([]);
  const [davetiye, setDavetiye] = useState<Opt[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tip = asKind(search.get("tip"));
    if (tip) setKind(tip);
  }, [search]);

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
        setGazete(Array.isArray(d.gazete) ? d.gazete : []);
        setDavetiye(Array.isArray(d.davetiye) ? d.davetiye : []);
      })
      .catch(() => router.replace(lp(locale, "/etsy")))
      .finally(() => setLoading(false));
  }, [locale, router]);

  const options = kind === "davetiye" ? davetiye : kind === "gazete" ? gazete : [];

  function selectKind(next: LockedKind) {
    setKind(next);
    setError("");
    router.replace(`${lp(locale, "/etsy/sec")}?tip=${next}`);
  }

  function backToKinds() {
    setKind(null);
    setError("");
    router.replace(lp(locale, "/etsy/sec"));
  }

  async function pick(slug: string) {
    if (!kind) return;
    setBusy(slug);
    setError("");
    try {
      const res = await fetch("/api/etsy/sec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, kind }),
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

  if (!kind) {
    return (
      <div className="etsy-gate">
        <div className="etsy-gate__card etsy-pick">
          <p className="etsy-gate__brand">Davetanisi</p>
          <h1>{en ? "Choose your free product" : "Ücretsiz ürününüzü seçin"}</h1>
          <p className="etsy-gate__lead">
            {en
              ? "One code = one free product. Pick newspapers or invitations, then choose a design."
              : "Bir kod = bir ücretsiz ürün. Önce Gazeteler veya Davetiyeler, sonra bir tasarım seçin."}
          </p>
          {error ? <p className="field__error" role="alert">{error}</p> : null}
          <div className="etsy-pick__kinds">
            <button type="button" className="etsy-pick__kind" onClick={() => selectKind("gazete")}>
              <strong>{en ? "Newspapers" : "Gazeteler"}</strong>
              <small>{en ? "Edit text & photos, download PDF" : "Metin ve foto düzenle, PDF indir"}</small>
              <Icon name="arrow" size={16} />
            </button>
            <button type="button" className="etsy-pick__kind" onClick={() => selectKind("davetiye")}>
              <strong>{en ? "Invitations" : "Davetiyeler"}</strong>
              <small>{en ? "Design pages & share guest link" : "Sayfaları tasarla, misafir linki paylaş"}</small>
              <Icon name="arrow" size={16} />
            </button>
          </div>
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
            ? en ? "Choose an invitation" : "Bir davetiye seçin"
            : en ? "Choose a newspaper" : "Bir gazete seçin"}
        </h1>
        <p className="etsy-gate__lead">
          {en ? "Pick one design — it locks to your code." : "Bir tasarım seçin; kodunuza kilitlenir."}
        </p>
        <button type="button" className="btn btn--ghost btn--sm" onClick={backToKinds}>
          {en ? "← Newspapers or invitations" : "← Gazeteler veya Davetiyeler"}
        </button>
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
