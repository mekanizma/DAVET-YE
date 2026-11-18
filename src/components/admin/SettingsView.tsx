"use client";

import { useEffect, useState } from "react";
import { adminSend } from "./AdminShell";
import { IbanCard } from "@/components/checkout/IbanCard";
import { formatIban, isValidIban } from "@/lib/format";
import type { PaymentSettings } from "@/lib/catalog";

const EMPTY: PaymentSettings = {
  bankName: "",
  accountHolder: "",
  iban: "",
  instructions: "",
  supportEmail: "",
  supportPhone: "",
  shopierEnabled: true,
  ibanEnabled: false,
};

export default function SettingsView() {
  const [form, setForm] = useState<PaymentSettings>(EMPTY);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [cardOk, setCardOk] = useState(false);

  useEffect(() => {
    adminSend<{
      settings: PaymentSettings;
      paymentReady: boolean;
      cardPayments: boolean;
      bankTransfer: boolean;
    }>("/api/yonetim/ayarlar")
      .then((d) => {
        setForm({
          ...EMPTY,
          ...d.settings,
          shopierEnabled: d.settings.shopierEnabled !== false,
          ibanEnabled: d.settings.ibanEnabled === true,
        });
        setReady(d.paymentReady);
        setCardOk(d.cardPayments);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  function set<K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setInfo("");
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      await adminSend("/api/yonetim/ayarlar", { method: "PUT", body: JSON.stringify(form) });
      const nextReady = isValidIban(form.iban) && form.accountHolder.trim().length >= 3;
      setReady(nextReady);
      setCardOk(form.shopierEnabled);
      const parts: string[] = [];
      if (form.shopierEnabled) parts.push("Shopier açık");
      else parts.push("Shopier kapalı");
      if (form.ibanEnabled && nextReady) parts.push("IBAN açık");
      else if (form.ibanEnabled) parts.push("IBAN seçildi ama hesap eksik");
      else parts.push("IBAN kapalı");
      setInfo(`Kaydedildi. ${parts.join(" · ")}.`);
      setForm((f) => ({ ...f, iban: f.iban.replace(/\s+/g, "").toUpperCase() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  const ibanOk = isValidIban(form.iban);
  const bothOff = !form.shopierEnabled && !form.ibanEnabled;

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Ödeme</h1>
          <p>Aktif ettiğiniz yöntem(ler) müşteri ödeme ekranında görünür. Kapalı olan hiç çıkmaz.</p>
        </div>
      </header>

      <section className="adm-card">
        <h2>Ödeme yöntemleri</h2>
        <div className="adm-toggles">
          <label className="adm-toggle">
            <input
              type="checkbox"
              checked={form.shopierEnabled}
              onChange={(e) => set("shopierEnabled", e.target.checked)}
            />
            <span>
              <strong>Shopier</strong>
              <small>Kart / Shopier ödeme sayfası</small>
            </span>
          </label>
          <label className="adm-toggle">
            <input
              type="checkbox"
              checked={form.ibanEnabled}
              onChange={(e) => set("ibanEnabled", e.target.checked)}
            />
            <span>
              <strong>IBAN / Havale</strong>
              <small>Havale veya EFT ile ödeme</small>
            </span>
          </label>
        </div>
        {bothOff && (
          <p className="alert alert--warn" role="status">
            İkisi de kapalıyken müşteri ödeme seçeneği göremez.
          </p>
        )}
        {form.shopierEnabled && !cardOk && (
          <p className="muted">Shopier anahtarı (SHOPIER_PAT) tanımlı değilse kart ödemesi müşteriye açılmaz.</p>
        )}
        {form.ibanEnabled && !ibanOk && (
          <p className="muted">IBAN açık; hesabı aşağıdan tamamlayın ki havale seçeneği görünsün.</p>
        )}
      </section>

      <section className="adm-card">
        <h2>Havale hesabı</h2>
        <div className="adm-grid2">
          <label className="lbl">Banka
            <input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="Örn. Ziraat Bankası" />
          </label>
          <label className="lbl">Hesap sahibi
            <input value={form.accountHolder} onChange={(e) => set("accountHolder", e.target.value)} autoComplete="name" />
          </label>
        </div>
        <label className="lbl">IBAN
          <input
            value={formatIban(form.iban)}
            onChange={(e) => set("iban", e.target.value.toUpperCase())}
            inputMode="text"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
          />
        </label>
        <p className="field__hint">{ibanOk ? "IBAN geçerli." : "TR ve 24 rakam, toplam 26 karakter."}</p>
        <label className="lbl">Müşteriye yönerge
          <textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} />
        </label>
        <div className="adm-grid2">
          <label className="lbl">Destek e-posta
            <input type="email" inputMode="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
          </label>
          <label className="lbl">Destek telefon
            <input type="tel" inputMode="tel" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />
          </label>
        </div>
        {error && <p className="alert alert--error" role="alert">{error}</p>}
        {info && <p className="alert alert--success" role="status">{info}</p>}
        <div className="adm-actions">
          <button type="button" className="btn btn--dark" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Kaydet"}</button>
          {!ready && form.ibanEnabled && <span className="muted">Havale için hesap eksik</span>}
        </div>
      </section>

      <section className="adm-card">
        <h2>Müşterinin göreceği kart</h2>
        <IbanCard settings={{ ...form, iban: form.iban.replace(/\s+/g, "") }} total={990} code="DV-ÖRNEK" title="Örnek sipariş" />
      </section>
    </>
  );
}
