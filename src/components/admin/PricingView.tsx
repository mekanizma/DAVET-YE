"use client";

import { useState } from "react";
import { adminSend, useAdminQuery } from "./AdminShell";
import type { CatalogAddon } from "@/lib/catalog";

interface Payload {
  addons: CatalogAddon[];
  defaults: CatalogAddon[];
  studioPrice: number;
  studioDefault: number;
  features: string[];
  defaultFeatures: string[];
}

export default function PricingView() {
  const query = useAdminQuery<Payload>("/api/yonetim/fiyatlar");
  const [data, setData] = useState<Payload | null>(null);
  const [addons, setAddons] = useState<CatalogAddon[]>([]);
  const [studio, setStudio] = useState(99);
  const [features, setFeatures] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (query.data && data === null) {
    setData(query.data);
    setAddons(query.data.addons);
    setStudio(query.data.studioPrice);
    setFeatures(query.data.features.join("\n"));
  }

  function patch(id: string, p: Partial<CatalogAddon>) {
    setAddons((list) => list.map((a) => (a.id === id ? { ...a, ...p } : a)));
    setInfo("");
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      await adminSend("/api/yonetim/fiyatlar", {
        method: "PUT",
        body: JSON.stringify({
          studioPrice: studio,
          features: features.split("\n"),
          addons: addons.map((a) => ({
            id: a.id,
            title: a.title,
            note: a.note ?? "",
            text: a.text,
            price: Number(a.price) || 0,
            was: a.was == null ? null : Number(a.was),
            active: a.active,
            included: a.included,
          })),
        }),
      });
      setInfo("Fiyatlar kaydedildi.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  const loadError = error || query.error;
  if (loadError && !data) return <p className="alert alert--error">{loadError}</p>;
  if (!data) return <p role="status">Yükleniyor…</p>;

  return (
    <>
      <header className="adm-h">
        <div>
          <h1>Fiyatlar</h1>
          <p>Eklenti, ek dil ve tasarım stüdyosu fiyatları. “Ücretsiz dahil” işaretli ürün sipariş özetinde 0 TL görünür, buradaki fiyat üstü çizili değer olur.</p>
        </div>
      </header>

      <section className="adm-card">
        <h2>Tasarım stüdyosu</h2>
        <p className="muted">Filigransız indirme, kart başına tek seferlik. Filigranlı indirme ücretsiz kalır.</p>
        <label className="lbl">Filigransız indirme (TL)
          <input inputMode="numeric" value={studio} onChange={(e) => setStudio(Number(e.target.value.replace(/\D/g, "") || 0))} />
        </label>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStudio(data.studioDefault)}>Varsayılan ({data.studioDefault} TL)</button>
      </section>

      <section className="adm-card">
        <h2>Fiyat sayfası maddeleri</h2>
        <label className="lbl">Her satır bir madde
          <textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={5} />
        </label>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFeatures(data.defaultFeatures.join("\n"))}>Varsayılan metin</button>
      </section>

      <div className="price-list">
        {addons.map((a) => (
          <article key={a.id} className="price-edit">
            <h3>{a.title}</h3>
            <p className="slug">{a.id}</p>
            <label className="lbl">Başlık
              <input value={a.title} onChange={(e) => patch(a.id, { title: e.target.value })} />
            </label>
            <div className="adm-grid2">
              <label className="lbl">Kısa not
                <input value={a.note ?? ""} onChange={(e) => patch(a.id, { note: e.target.value })} />
              </label>
              <label className="lbl">Fiyat (TL)
                <input inputMode="numeric" value={a.price} onChange={(e) => patch(a.id, { price: Number(e.target.value.replace(/\D/g, "") || 0) })} />
              </label>
            </div>
            <label className="lbl">Üstü çizili fiyat (boş bırakılabilir)
              <input inputMode="numeric" value={a.was ?? ""} onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                patch(a.id, { was: raw ? Number(raw) : undefined });
              }} />
            </label>
            <label className="lbl">Açıklama
              <textarea value={a.text} onChange={(e) => patch(a.id, { text: e.target.value })} />
            </label>
            <div className="checks">
              <label><input type="checkbox" checked={a.active} onChange={(e) => patch(a.id, { active: e.target.checked })} /> Yayında</label>
              <label><input type="checkbox" checked={a.included} onChange={(e) => patch(a.id, { included: e.target.checked })} /> Ücretsiz dahil</label>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => {
                const base = data.defaults.find((d) => d.id === a.id);
                if (base) patch(a.id, base);
              }}>Varsayılan</button>
            </div>
          </article>
        ))}
      </div>

      <div className="adm-save">
        <p>{info || loadError || "Değişiklikler kaydedilince site fiyatına yansır."}</p>
        <button type="button" className="btn" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Kaydet"}</button>
      </div>
    </>
  );
}
