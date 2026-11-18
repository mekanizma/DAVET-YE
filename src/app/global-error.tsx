"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: "Georgia, serif", background: "#f6f1e7", color: "#1c241c" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 420, display: "grid", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Bir şeyler ters gitti</h1>
            <p style={{ margin: 0, opacity: 0.75 }}>
              {error?.message ? "Sayfa yeniden açılsın." : "Sayfayı yenilemeniz yeterli olabilir."}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 44,
                borderRadius: 999,
                border: "none",
                background: "#1c241c",
                color: "#f6f1e7",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              Yenile
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
