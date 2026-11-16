"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/i18n/provider";

function CartIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 12h4l3.2 18.5h18.6l3.4-12.5H16.2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="36.5" r="2.4" fill="currentColor" />
      <circle cx="33.5" cy="36.5" r="2.4" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="12" y="20" width="24" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M17 20v-5a7 7 0 0 1 14 0v5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="29" r="2.2" fill="currentColor" />
    </svg>
  );
}

function PayIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M16 30c0-5.5 5.2-8.5 10.5-8.5h1.2c4.4 0 8.3 2.6 8.3 6.6 0 3.4-2.4 5.5-6.2 6.2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="33" r="7.2" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M24 29.2v7.6M21.4 31.4h4.4c1.2 0 2.1.8 2.1 1.9s-.9 1.9-2.1 1.9h-3.2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function VisaMark() {
  return (
    <svg className="pay-trust__brand" viewBox="0 0 72 24" role="img" aria-label="Visa">
      <text x="2" y="18" fontFamily="Arial Black, Arial, sans-serif" fontSize="18" fontStyle="italic" fontWeight="800" fill="#1A1F71">VISA</text>
      <path d="M2 20h40" stroke="#F9A81B" strokeWidth="2.2" />
    </svg>
  );
}

function MasterCardMark() {
  return (
    <svg className="pay-trust__brand pay-trust__brand--mc" viewBox="0 0 56 34" role="img" aria-label="Mastercard">
      <circle cx="20" cy="17" r="12" fill="#EB001B" />
      <circle cx="36" cy="17" r="12" fill="#F79E1B" />
      <path d="M28 8.2a12 12 0 0 1 0 17.6 12 12 0 0 1 0-17.6z" fill="#FF5F00" />
    </svg>
  );
}

function TroyMark() {
  return (
    <svg className="pay-trust__brand" viewBox="0 0 72 24" role="img" aria-label="Troy">
      <text x="4" y="17" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700" letterSpacing="1.5" fill="#13201c">troy</text>
    </svg>
  );
}

function SslLock() {
  return (
    <svg viewBox="0 0 20 22" aria-hidden="true">
      <rect x="3" y="9" width="14" height="11" rx="2" fill="currentColor" />
      <path d="M6.2 9V6.4a3.8 3.8 0 0 1 7.6 0V9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="1.4" fill="#fffcf7" />
    </svg>
  );
}

function Step({
  n,
  label,
  children,
}: {
  n: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="pay-trust__step">
      <span className="pay-trust__badge" aria-hidden="true">{n}</span>
      <span className="pay-trust__ring">{children}</span>
      <span className="pay-trust__label">{label}</span>
    </li>
  );
}

export default function PaymentTrust() {
  const locale = useLocale();
  const en = locale === "en";

  return (
    <aside className="pay-trust" aria-label={en ? "Secure Shopier payment" : "Güvenli Shopier ödemesi"}>
      <p className="pay-trust__kicker">{en ? "Shopier secure checkout" : "Shopier güvenli ödeme"}</p>

      <ol className="pay-trust__flow">
        <Step n={1} label={en ? "Order" : "Sipariş"}>
          <CartIcon />
        </Step>
        <li className="pay-trust__bridge" aria-hidden="true">
          <span className="pay-trust__arrow" />
        </li>
        <Step n={2} label="3D Secure">
          <LockIcon />
        </Step>
        <li className="pay-trust__bridge" aria-hidden="true">
          <span className="pay-trust__arrow" />
        </li>
        <Step n={3} label={en ? "Paid" : "Ödeme"}>
          <PayIcon />
        </Step>
      </ol>

      <div className="pay-trust__bar">
        <div className="pay-trust__cards" aria-label={en ? "Accepted cards" : "Kabul edilen kartlar"}>
          <VisaMark />
          <MasterCardMark />
          <TroyMark />
        </div>
        <p className="pay-trust__ssl">
          <SslLock />
          <span>256 Bit SSL</span>
        </p>
      </div>
    </aside>
  );
}
