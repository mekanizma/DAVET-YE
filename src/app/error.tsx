"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 420, display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Sayfa yüklenemedi</h1>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Geçici bir hata oluştu. Yenileyip yeniden deneyin.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn--dark" onClick={() => reset()}>
            Tekrar dene
          </button>
          <button type="button" className="btn btn--outline" onClick={() => window.location.assign("/")}>
            Ana sayfa
          </button>
        </div>
      </div>
    </main>
  );
}
