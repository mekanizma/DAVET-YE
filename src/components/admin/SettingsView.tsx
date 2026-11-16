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
};

export default function SettingsView() {
  const [form, setForm] = useState<PaymentSettings>(EMPTY);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    adminSend<{ settings: PaymentSettings; paymentReady: boolean }>("/api/yonetim/ayarlar")
      .then((d) => {
        setForm(d.settings);
        setReady(d.paymentReady);
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
      setReady(true);
      setInfo("Havale hesabı kaydedildi. Yeni siparişler bu IBAN’ı görür.");
      setForm((f) => ({ ...f, iban: f.iban.replace(/\s+/g, "").toUpperCase() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  const ibanOk = isValidIban(form.iban);

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Ödeme hesabı</h1>
          <p>İlk aşamada tahsilat yalnızca bu IBAN’a havale veya EFT ile yapılır. Kart, sanal POS veya kapıda ödeme yoktur.</p>
        </div>
      </header>

      <section className="adm-card">
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
          <button type="button" className="btn btn--dark" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Hesabı kaydet"}</button>
          {!ready && <span className="muted">Kayıtlı hesap yok</span>}
        </div>
      </section>

      <section className="adm-card">
        <h2>Müşterinin göreceği kart</h2>
        <IbanCard settings={{ ...form, iban: form.iban.replace(/\s+/g, "") }} total={990} code="DV-ÖRNEK" title="Örnek sipariş" />
      </section>
    </>
  );
}
