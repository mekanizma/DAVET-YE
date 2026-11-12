"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import { CONSENT, OPEN_CONSENT_EVENT, getLocalJson, setLocalJson, type ConsentChoice } from "@/lib/storage";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = getLocalJson<ConsentChoice | null>(CONSENT, null);
    if (!existing) setVisible(true);
    const open = () => {
      const c = getLocalJson<ConsentChoice | null>(CONSENT, null);
      setAnalytics(Boolean(c?.analytics));
      setMarketing(Boolean(c?.marketing));
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
        <h2 id={titleId}>Çerez tercihlerinizi yönetin</h2>
        <Link href="/tr/cerez" className="cookie__policy">
          Çerez politikası
        </Link>
      </div>
      <p className="cookie__text">
        Size daha iyi ve güvenli bir deneyim sunmak için zorunlu ve isteğe bağlı çerezler
        kullanıyoruz.
      </p>
      {manage && (
        <fieldset className="cookie__prefs">
          <legend className="sr-only">Çerez kategorileri</legend>
          <label className="switch-row">
            <input type="checkbox" checked disabled />
            <span>
              <strong>Zorunlu</strong>
              <small>Oturum ve güvenlik için gereklidir; kapatılamaz.</small>
            </span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            <span>
              <strong>Analitik</strong>
              <small>Bu yerel klonda analitik betik yüklenmez; tercih yalnızca kaydedilir.</small>
            </span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            <span>
              <strong>Pazarlama</strong>
              <small>Bu yerel klonda pazarlama çerezi kullanılmaz.</small>
            </span>
          </label>
        </fieldset>
      )}
      <div className="cookie__actions">
        {manage ? (
          <button type="button" className="btn btn--ghost" onClick={() => save(analytics, marketing)}>
            Tercihleri kaydet
          </button>
        ) : (
          <button type="button" className="btn btn--ghost btn--block-sm" onClick={() => setManage(true)}>
            <Icon name="sliders" size={16} /> Tercihleri yönet
          </button>
        )}
        <button type="button" className="btn btn--outline" onClick={() => save(false, false)}>
          Sadece zorunlu
        </button>
        <button type="button" className="btn btn--dark" onClick={() => save(true, true)}>
          Tümünü kabul et
        </button>
      </div>
    </div>
  );
}
