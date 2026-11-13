"use client";

import { marketing } from "@/i18n/marketing";
import { useLocale } from "@/i18n/provider";
import { OPEN_CONSENT_EVENT } from "@/lib/storage";

export default function ConsentButton() {
  const copy = marketing(useLocale());
  return (
    <button
      type="button"
      className="link-btn"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      {copy.cookiePrefs}
    </button>
  );
}
