"use client";

import Link from "next/link";
import Icon from "../Icon";
import IbanCheckout, { type PlacedOrder } from "../checkout/IbanCheckout";
import { useCatalog } from "@/components/CatalogProvider";
import { EVENT_LABELS } from "@/data/themes";
import { useLocale } from "@/i18n/provider";
import { priceTotal } from "@/lib/pricing";
import { invitationShareDesign, suggestShareSlug } from "@/lib/shareSlug";
import { getLocalJson, saveDraft, setLocalJson, type InvitationDraft, type StoredOrder } from "@/lib/storage";

function remember(draft: InvitationDraft, title: string, order: PlacedOrder) {
  saveDraft({
    order: { code: order.code, status: order.status as NonNullable<InvitationDraft["order"]>["status"], at: order.at, total: order.total, email: order.email },
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

export default function StepPayment({ draft, title }: { draft: InvitationDraft; title: string }) {
  const locale = useLocale();
  const en = locale === "en";
  const cat = useCatalog();
  const total = priceTotal(draft, cat, locale);
  if (draft.order?.status === "test-success") {
    return (
      <div className="pay-done" role="status">
        <span className="pay-done__icon"><Icon name="check" size={28} /></span>
        <h2>{en ? "Earlier test order" : "Eski test siparişi"}</h2>
        <p>
          {en ? (
            <>
              Order code: <strong className="num">{draft.order.code}</strong>. This record is left from an earlier trial. New orders are paid by card on Shopier.
            </>
          ) : (
            <>
              Sipariş kodu: <strong className="num">{draft.order.code}</strong>. Bu kayıt eski bir denemeden kalmıştır. Yeni siparişler Shopier ile karttan alınır.
            </>
          )}
        </p>
        <div className="pay-done__cta">
          <Link href="/panel" className="btn btn--outline btn--lg">{en ? "Go to my account" : "Panelime git"}</Link>
        </div>
      </div>
    );
  }

  const i = draft.info;
  const snapshot: Record<string, string> = {
    Etkinlik: draft.event ? EVENT_LABELS[draft.event] : "",
    İsimler: [i.partnerA, i.partnerB].filter(Boolean).join(" & "),
    Tarih: [i.date, i.time].filter(Boolean).join(" "),
    Mekan: [i.venue, i.address].filter(Boolean).join(" — "),
    Diller: draft.languages.join(", "),
  };
  if (draft.event === "coklu" && i.kinaDate) snapshot["Kına"] = [i.kinaDate, i.kinaTime].filter(Boolean).join(" ");

  return (
    <IbanCheckout
      kind="davetiye"
      template={draft.template || ""}
      title={title}
      languages={draft.languages}
      addons={draft.addons}
      snapshot={snapshot}
      shareSlug={suggestShareSlug([i.partnerA, i.partnerB].filter(Boolean).join(" "))}
      design={invitationShareDesign(draft)}
      previewTotal={total}
      resume={draft.order?.email ? { code: draft.order.code, email: draft.order.email } : null}
      onUpdate={(order) => remember(draft, title, order)}
    />
  );
}
