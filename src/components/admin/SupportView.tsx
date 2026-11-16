"use client";

import { useMemo, useState } from "react";
import { adminSend, useAdminQuery } from "./AdminShell";
import type { SupportRequest, SupportStatus } from "@/lib/support";

const FILTERS: { id: "" | SupportStatus; label: string }[] = [
  { id: "", label: "Tümü" },
  { id: "new", label: "Yeni" },
  { id: "read", label: "Okundu" },
  { id: "done", label: "Tamam" },
];

const STATUS_LABEL: Record<SupportStatus, string> = {
  new: "Yeni",
  read: "Okundu",
  done: "Tamam",
};

export default function SupportView() {
  const [durum, setDurum] = useState<"" | SupportStatus>("");
  const [tick, setTick] = useState(0);
  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (durum) p.set("durum", durum);
    if (tick) p.set("_", String(tick));
    const q = p.toString();
    return q ? `/api/yonetim/destek?${q}` : "/api/yonetim/destek";
  }, [durum, tick]);
  const query = useAdminQuery<{ items: SupportRequest[] }>(url);
  const items = query.data?.items ?? null;
  const [busyId, setBusyId] = useState("");
  const [localError, setLocalError] = useState("");

  async function setStatus(id: string, status: SupportStatus) {
    if (busyId) return;
    setBusyId(id);
    setLocalError("");
    try {
      await adminSend("/api/yonetim/destek", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      setTick((n) => n + 1);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Güncellenemedi.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Destek</h1>
          <p>Sitedeki destek butonu ve iletişim formundan gelen talepler burada toplanır.</p>
        </div>
      </header>
      <div className="adm-filters" role="tablist" aria-label="Durum">
        {FILTERS.map((f) => (
          <button
            key={f.id || "all"}
            type="button"
            className={`adm-chip${durum === f.id ? " is-on" : ""}`}
            onClick={() => setDurum(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {(query.error || localError) && (
        <p className="alert alert--error" role="alert">{localError || query.error}</p>
      )}
      {items === null ? (
        <p role="status">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="muted">Bu süzgeçte destek talebi yok.</p>
      ) : (
        <div className="ord-list">
          {items.map((row) => (
            <article key={row.id} className="ord">
              <div>
                <div className="ord__top">
                  <strong>
                    {row.firstName} {row.lastName}
                  </strong>
                  <span className={`pill pill--${row.status === "new" ? "bildirildi" : row.status === "done" ? "onaylandi" : "bekliyor"}`}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </div>
                <small>
                  <a href={`mailto:${row.email}`}>{row.email}</a>
                  {" · "}
                  {row.source === "widget" ? "Destek butonu" : "İletişim sayfası"}
                </small>
                <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{row.message}</p>
                <div className="ord__bot" style={{ marginTop: 10, gap: 8 }}>
                  <small className="num">{new Date(row.createdAt).toLocaleString("tr-TR")}</small>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {row.status !== "read" ? (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        disabled={busyId === row.id}
                        onClick={() => void setStatus(row.id, "read")}
                      >
                        Okundu
                      </button>
                    ) : null}
                    {row.status !== "done" ? (
                      <button
                        type="button"
                        className="btn btn--dark btn--sm"
                        disabled={busyId === row.id}
                        onClick={() => void setStatus(row.id, "done")}
                      >
                        Tamamla
                      </button>
                    ) : null}
                    {row.status !== "new" ? (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        disabled={busyId === row.id}
                        onClick={() => void setStatus(row.id, "new")}
                      >
                        Yeni
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
