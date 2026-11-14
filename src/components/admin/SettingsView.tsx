"use client";

import { useState } from "react";
import { adminSend, useAdminQuery } from "./AdminShell";
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
  const query = useAdminQuery<{ settings: PaymentSettings; paymentReady: boolean }>("/api/yonetim/ayarlar");
  const [form, setForm] = useState<PaymentSettings>(EMPTY);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (query.data && !ready) {
    setForm(query.data.settings);
    setReady(true);
  }

  function set<K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setInfo("");
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      await adminSend("/api/yonetim/ayarlar", { method: "PUT", body: JSON.stringify(form) });
      setInfo("Destek bilgisi kaydedildi.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Ödeme</h1>
          <p>Tahsilat Shopier POS ile karttan alınır. Müşteri ödeme sayfasında IBAN görmez. Destek bilgisi o sayfada durur.</p>
        </div>
      </header>

      <section className="adm-card">
        <div className="adm-grid2">
          <label className="lbl">Destek e-posta
            <input type="email" inputMode="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
          </label>
          <label className="lbl">Destek telefon
            <input type="tel" inputMode="tel" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />
          </label>
        </div>
        {(error || query.error) && <p className="alert alert--error" role="alert">{error || query.error}</p>}
        {info && <p className="alert alert--success" role="status">{info}</p>}
        <div className="adm-actions">
          <button type="button" className="btn btn--dark" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </section>
    </>
  );
}
