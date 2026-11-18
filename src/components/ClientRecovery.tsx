"use client";

import { useEffect } from "react";

/** Recover from stale Next.js chunks after a deploy without leaving a blank error page. */
export default function ClientRecovery() {
  useEffect(() => {
    const reloadOnce = () => {
      try {
        const key = "dv-chunk-reload";
        const last = Number(sessionStorage.getItem(key) || "0");
        if (Date.now() - last < 15_000) return;
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    const onError = (ev: ErrorEvent) => {
      const msg = String(ev.message || ev.error || "");
      if (/Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
        reloadOnce();
      }
    };

    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason;
      const msg = typeof reason === "string" ? reason : String(reason?.message || reason || "");
      if (/Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
        reloadOnce();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
