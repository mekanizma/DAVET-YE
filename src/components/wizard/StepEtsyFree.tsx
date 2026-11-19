"use client";

import { useState, type FormEvent } from "react";
import Icon from "../Icon";
import RepublishPanel from "@/components/share/RepublishPanel";
import { EVENT_LABELS } from "@/data/themes";
import { useLocale } from "@/i18n/provider";
import { invitationShareDesign, suggestShareSlug } from "@/lib/shareSlug";
import { getLocalJson, saveDraft, setLocalJson, type InvitationDraft, type StoredOrder } from "@/lib/storage";

type Placed = { code: string; status: string; at: string; total: number; email: string };

function remember(draft: InvitationDraft, title: string, order: Placed) {
  saveDraft({
    order: {
      code: order.code,
      status: order.status as NonNullable<InvitationDraft["order"]>["status"],
      at: order.at,
      total: order.total,
      email: order.email,
    },
  });
  const prev = getLocalJson<StoredOrder[]>("orders", []);
  const row: StoredOrder = {
    code: order.code,
    at: order.at,
    total: order.total,
    template: draft.template,
    title,
    status: order.status,
    kind: "davetiye",
    email: order.email,
  };
  setLocalJson("orders", [row, ...prev.filter((x) => x.code !== order.code)]);
}

export default function StepEtsyFree({
  draft,
  title,
  etsyCode,
}: {
  draft: InvitationDraft;
  title: string;
  etsyCode: string;
}) {
  const locale = useLocale();
  const en = locale === "en";
  const [name, setName] = useState(draft.order?.email ? "" : [draft.info.partnerA, draft.info.partnerB].filter(Boolean).join(" ").slice(0, 80));
  const [email, setEmail] = useState(draft.order?.email || "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (draft.order?.status === "onaylandi" && draft.order.code) {
    return (
      <RepublishPanel
        locale={locale}
        code={draft.order.code}
        design={invitationShareDesign(draft)}
        names={title}
      />
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const i = draft.info;
    const snapshot: Record<string, string> = {
      Etkinlik: draft.event ? EVENT_LABELS[draft.event] : "",
      İsimler: [i.partnerA, i.partnerB].filter(Boolean).join(" & "),
      Tarih: [i.date, i.time].filter(Boolean).join(" "),
      Mekan: [i.venue, i.address].filter(Boolean).join(" — "),
      Diller: draft.languages.join(", "),
    };
    try {
      const res = await fetch("/api/etsy/davetiye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          languages: draft.languages,
          addons: draft.addons,
          shareSlug: suggestShareSlug([i.partnerA, i.partnerB].filter(Boolean).join(" ")),
          design: invitationShareDesign(draft),
          snapshot,
          customer: { name, email, phone },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || (en ? "Could not activate." : "Etkinleştirilemedi."));
        return;
      }
      const order = (data as { order: { code: string; status: string; createdAt?: string; total: number; customer: { email: string } } }).order;
      remember(draft, title, {
        code: order.code,
        status: order.status,
        at: order.createdAt || new Date().toISOString(),
        total: order.total,
        email: order.customer.email,
      });
    } catch {
      setError(en ? "Network error." : "Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="pay-etsy" onSubmit={submit}>
      <div className="pay-done" role="status" style={{ marginBottom: 16 }}>
        <span className="pay-done__icon"><Icon name="check" size={28} /></span>
        <h2>{en ? "1 free invitation" : "1 ücretsiz davetiye"}</h2>
        <p>
          {en
            ? <>Your Etsy code <strong className="num">{etsyCode}</strong> covers this design. Enter your contact details to publish the guest link — no payment.</>
            : <>Etsy kodunuz <strong className="num">{etsyCode}</strong> bu tasarımı karşılar. Misafir linkini yayınlamak için iletişim bilgilerinizi yazın — ödeme yok.</>}
        </p>
      </div>
      <label className="field">
        <span className="field__label">{en ? "Full name" : "Ad soyad"}</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} autoComplete="name" />
      </label>
      <label className="field">
        <span className="field__label">{en ? "Email" : "E-posta"}</span>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
      </label>
      <label className="field">
        <span className="field__label">{en ? "Phone" : "Telefon"}</span>
        <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" inputMode="tel" />
      </label>
      {error ? <p className="field__error" role="alert">{error}</p> : null}
      <button type="submit" className="btn btn--dark btn--lg btn--block" disabled={busy} aria-busy={busy}>
        {busy ? (en ? "Activating…" : "Etkinleştiriliyor…") : en ? "Activate free invitation" : "Ücretsiz davetiyeyi etkinleştir"}
      </button>
    </form>
  );
}
