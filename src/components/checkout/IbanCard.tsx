"use client";

import { useState } from "react";
import Icon from "../Icon";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/locale";
import { formatIban, formatTL } from "@/lib/format";
import type { PaymentSettings } from "@/lib/catalog";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

export function CopyRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const locale = useLocale();
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
        <Icon name={done ? "check" : "copy"} size={14} /> {done ? tx(locale, "Kopyalandı", "Copied") : tx(locale, "Kopyala", "Copy")}
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
  const locale = useLocale();
  const iban = settings.iban ? formatIban(settings.iban) : tx(locale, "Henüz tanımlanmadı", "Not set yet");
  return (
    <div className="iban-card">
      <div className="iban-card__head">
        <span>{tx(locale, "Havale / EFT", "Bank transfer")}</span>
        <strong>{title || tx(locale, "Ödeme hesabı", "Payment account")}</strong>
      </div>
      {settings.bankName && <CopyRow label={tx(locale, "Banka", "Bank")} value={settings.bankName} />}
      <CopyRow label={tx(locale, "Hesap sahibi", "Account holder")} value={settings.accountHolder || "—"} />
      <CopyRow label="IBAN" value={iban} copyValue={settings.iban.replace(/\s+/g, "")} />
      <CopyRow label={tx(locale, "Tutar", "Amount")} value={formatTL(total, locale)} copyValue={String(total)} />
      {code && <CopyRow label={tx(locale, "Açıklama / sipariş kodu", "Reference / order code")} value={code} />}
    </div>
  );
}
