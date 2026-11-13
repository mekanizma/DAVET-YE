"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import { useLocale, useLp } from "@/i18n/provider";
import { CONSENT, OPEN_CONSENT_EVENT, getLocalJson, setLocalJson, type ConsentChoice } from "@/lib/storage";

export default function CookieBanner() {
  const en = useLocale() === "en";
  const lp = useLp();
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketingOn, setMarketingOn] = useState(false);
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const text = en
    ? {
        title: "Manage your cookie preferences",
        policy: "Cookie policy",
        body: "We use necessary and optional cookies so the site stays safe and easier to use.",
        legend: "Cookie categories",
        necessary: "Necessary",
        necessaryNote: "Required for the session and for security. This cannot be turned off.",
        analytics: "Analytics",
        analyticsNote: "This local copy does not load an analytics script. Your choice is only saved.",
        marketing: "Marketing",
        marketingNote: "This local copy does not use a marketing cookie.",
        save: "Save preferences",
        manage: "Manage preferences",
        necessaryOnly: "Necessary only",
        accept: "Accept all",
      }
    : {
        title: "Çerez tercihlerinizi yönetin",
        policy: "Çerez politikası",
        body: "Size daha iyi ve güvenli bir deneyim sunmak için zorunlu ve isteğe bağlı çerezler kullanıyoruz.",
        legend: "Çerez kategorileri",
        necessary: "Zorunlu",
        necessaryNote: "Oturum ve güvenlik için gereklidir; kapatılamaz.",
        analytics: "Analitik",
        analyticsNote: "Bu yerel klonda analitik betik yüklenmez; tercih yalnızca kaydedilir.",
        marketing: "Pazarlama",
        marketingNote: "Bu yerel klonda pazarlama çerezi kullanılmaz.",
        save: "Tercihleri kaydet",
        manage: "Tercihleri yönet",
        necessaryOnly: "Sadece zorunlu",
        accept: "Tümünü kabul et",
      };

  useEffect(() => {
    const existing = getLocalJson<ConsentChoice | null>(CONSENT, null);
    if (!existing) setVisible(true);
    const open = () => {
      const c = getLocalJson<ConsentChoice | null>(CONSENT, null);
      setAnalytics(Boolean(c?.analytics));
      setMarketingOn(Boolean(c?.marketing));
      setManage(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  useEffect(() => {
    if (visible && manage) ref.current?.focus();
  }, [visible, manage]);

  function save(a: boolean, m: boolean) {
    setLocalJson(CONSENT, {
      necessary: true,
      analytics: a,
      marketing: m,
      at: new Date().toISOString(),
    } satisfies ConsentChoice);
    setVisible(false);
    setManage(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="cookie"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="cookie__head">
        <h2 id={titleId}>{text.title}</h2>
        <Link href={lp("/cerez")} className="cookie__policy">
          {text.policy}
        </Link>
      </div>
      <p className="cookie__text">{text.body}</p>
      {manage && (
        <fieldset className="cookie__prefs">
          <legend className="sr-only">{text.legend}</legend>
          <label className="switch-row">
            <input type="checkbox" checked disabled />
            <span>
              <strong>{text.necessary}</strong>
              <small>{text.necessaryNote}</small>
            </span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            <span>
              <strong>{text.analytics}</strong>
              <small>{text.analyticsNote}</small>
            </span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={marketingOn} onChange={(e) => setMarketingOn(e.target.checked)} />
            <span>
              <strong>{text.marketing}</strong>
              <small>{text.marketingNote}</small>
            </span>
          </label>
        </fieldset>
      )}
      <div className="cookie__actions">
        {manage ? (
          <button type="button" className="btn btn--ghost" onClick={() => save(analytics, marketingOn)}>
            {text.save}
          </button>
        ) : (
          <button type="button" className="btn btn--ghost btn--block-sm" onClick={() => setManage(true)}>
            <Icon name="sliders" size={16} /> {text.manage}
          </button>
        )}
        <button type="button" className="btn btn--outline" onClick={() => save(false, false)}>
          {text.necessaryOnly}
        </button>
        <button type="button" className="btn btn--dark" onClick={() => save(true, true)}>
          {text.accept}
        </button>
      </div>
    </div>
  );
}
