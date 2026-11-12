"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/storage";

export default function ConsentButton() {
  return (
    <button
      type="button"
      className="link-btn"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      Çerez tercihleri
    </button>
  );
}
