"use client";

import { useState } from "react";
import Icon from "../Icon";
import { formatIban, formatTL } from "@/lib/format";
import type { PaymentSettings } from "@/lib/catalog";

export function CopyRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    const text = copyValue ?? value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  }
  return (
    <div className="iban-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <button type="button" className="btn btn--outline btn--sm" onClick={copy}>
        <Icon name={done ? "check" : "copy"} size={14} /> {done ? "Kopyalandı" : "Kopyala"}
      </button>
    </div>
  );
}

export function IbanCard({
  settings,
  total,
  code,
  title,
}: {
  settings: PaymentSettings;
  total: number;
  code?: string;
  title?: string;
}) {
  const iban = settings.iban ? formatIban(settings.iban) : "Henüz tanımlanmadı";
  return (
    <div className="iban-card">
      <div className="iban-card__head">
        <span>Havale / EFT</span>
        <strong>{title || "Ödeme hesabı"}</strong>
      </div>
      {settings.bankName && <CopyRow label="Banka" value={settings.bankName} />}
      <CopyRow label="Hesap sahibi" value={settings.accountHolder || "—"} />
      <CopyRow label="IBAN" value={iban} copyValue={settings.iban.replace(/\s+/g, "")} />
      <CopyRow label="Tutar" value={formatTL(total)} copyValue={String(total)} />
      {code && <CopyRow label="Açıklama / sipariş kodu" value={code} />}
    </div>
  );
}
