"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import Icon from "../Icon";
import { TextAreaField, TextField } from "../Field";
import { useCatalog } from "@/components/CatalogProvider";
import { useLocale } from "@/i18n/provider";
import { withLocaleQuery, type Locale } from "@/i18n/locale";
import { localizeError, statusLabel } from "@/i18n/product";
import { formatTL, isEmail } from "@/lib/format";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orderStatus";
import type { OrderRecord } from "@/lib/orderTypes";
import ShareLinkCard from "@/components/share/ShareLinkCard";
import { shareMonths, type SharePublic } from "@/lib/shareSlug";

export interface PlacedOrder {
  code: string;
  status: string;
  at: string;
  total: number;
  email: string;
}

type Phase = "form" | "pay";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function stamp(iso: string, locale: Locale) {
  return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IbanCheckout({
  kind,
  template,
  title,
  languages = [],
  addons = [],
  snapshot = {},
  previewTotal,
  resume,
  onUpdate,
  shareSlug = "",
  design,
}: {
  kind: "davetiye" | "gazete";
  template: string;
  title: string;
  languages?: string[];
  addons?: string[];
  snapshot?: Record<string, string>;
  previewTotal: number;
  resume?: { code: string; email: string } | null;
  onUpdate?: (order: PlacedOrder) => void;
  shareSlug?: string;
  design?: unknown;
}) {
  const locale = useLocale();
  const cat = useCatalog();
  const [phase, setPhase] = useState<Phase>(resume?.code ? "pay" : "form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(resume?.email ?? "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [share, setShare] = useState<SharePublic | null>(null);
  const [pathName, setPathName] = useState(shareSlug);

  function remember(o: OrderRecord) {
    setOrder(o);
    onUpdate?.({ code: o.code, status: o.status, at: o.createdAt, total: o.total, email: o.customer.email });
  }

  useEffect(() => {
    if (!resume?.code || !resume.email) return;
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/siparis/${encodeURIComponent(resume!.code)}?email=${encodeURIComponent(resume!.email)}`);
      if (cancelled) return;
      if (!res.ok) {
        setPhase("form");
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      setOrder(data.order);
      setShare(data.share || null);
      setPhase("pay");
      onUpdate?.({
        code: data.order.code,
        status: data.order.status,
        at: data.order.createdAt,
        total: data.order.total,
        email: data.order.customer.email,
      });
    }
    load();
    return () => {
      cancelled = true;
    };
    // resume identity is stable enough for this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.code, resume?.email]);

  useEffect(() => {
    if (phase !== "pay" || !order || order.status === "onaylandi" || order.total === 0) return;
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/siparis/${encodeURIComponent(order!.code)}?email=${encodeURIComponent(order!.customer.email)}`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (cancelled || !data.order) return;
      setOrder(data.order);
      setShare(data.share || null);
      onUpdate?.({
        code: data.order.code,
        status: data.order.status,
        at: data.order.createdAt,
        total: data.order.total,
        email: data.order.customer.email,
      });
    }
    const timer = window.setInterval(load, 8000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, order?.code, order?.status, order?.total]);

  async function create(ev: FormEvent) {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (name.trim().length < 3) er.name = tx(locale, "Ad soyad yazın.", "Enter your full name.");
    if (!isEmail(email)) er.email = localizeError("Geçerli bir e-posta yazın.", locale);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) er.phone = localizeError("Telefon numarası eksik görünüyor.", locale);
    setErrors(er);
    setFailure("");
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/siparis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          template,
          languages,
          addons,
          customer: { name, email, phone },
          customerNote: note,
          snapshot,
          shareSlug: pathName,
          design,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFailure(localizeError(data.error || "Sipariş kaydedilemedi.", locale));
        return;
      }
      setShare(data.share || null);
      remember(data.order);
      setPhase("pay");
    } catch {
      setFailure(tx(locale, "Bağlantı kurulamadı. Yeniden deneyin.", "The connection could not be made. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  const status = order?.status as OrderStatus | undefined;
  const total = order?.total ?? previewTotal;
  const statusText = status ? statusLabel(status, locale, STATUS_LABEL[status] ?? status) : "";
  const canPay = Boolean(order) && order!.total > 0 && (status === "bekliyor" || status === "reddedildi") && cat.cardPayments;
  const support = [cat.settings.supportPhone, cat.settings.supportEmail].filter(Boolean).join(" · ");

  if (phase === "form") {
    return (
      <form className="iban-pay" onSubmit={create} noValidate>
        <div className="alert alert--info" role="note">
          <Icon name="lock" size={18} />
          <span>
            {locale === "en" ? (
              <>
                Payment is taken by <strong>card</strong> on Shopier. This page does not ask for a card number or an IBAN.
              </>
            ) : (
              <>
                Ödeme <strong>Shopier</strong> güvenli sayfasında kartla alınır. Bu sayfada kart numarası ve IBAN istenmez.
              </>
            )}
          </span>
        </div>
        {!cat.cardPayments && (
          <div className="alert alert--warn" role="status">
            <Icon name="alert" size={18} />
            <span>{tx(locale, "Kart ödemesi henüz açılmadı.", "Card payment is not open yet.")}</span>
          </div>
        )}
        <p className="pay__total">{tx(locale, "Ödenecek tutar", "Amount to pay")} <strong className="num">{formatTL(previewTotal, locale)}</strong></p>
        <TextField id="pay-name" label={tx(locale, "Ad soyad", "Full name")} required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
        <TextField id="pay-mail" type="email" label={tx(locale, "E-posta", "Email")} required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" inputMode="email" hint={tx(locale, "Sipariş durumunu bu adresle sorgularsınız.", "You look up the order status with this address.")} />
        <TextField id="pay-phone" type="tel" label={tx(locale, "Telefon", "Phone")} required value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" />
        <TextField
          id="pay-path"
          label={tx(locale, "Online adres", "Online address")}
          value={pathName}
          onChange={(e) => setPathName(e.target.value.toLowerCase())}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          hint={tx(
            locale,
            `Ödeme onayından sonra ${kind === "gazete" ? "gazeteniz" : "davetiyeniz"} ${shareMonths(kind)} ay boyunca davetanisi.com/d/ adresinde açık kalır.`,
            `After payment is confirmed, your ${kind === "gazete" ? "newspaper" : "invitation"} stays at davetanisi.com/d/ for ${shareMonths(kind)} months.`,
          )}
        />
        <TextAreaField id="pay-note" label={tx(locale, "Not (isteğe bağlı)", "Note (optional)")} value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} />
        {failure && <div className="alert alert--error" role="alert"><Icon name="alert" size={18} /><span>{failure}</span></div>}
        <button type="submit" className="btn btn--dark btn--lg btn--block btn--serif" disabled={busy || !cat.cardPayments}>
          <Icon name="lock" size={16} /> {busy ? tx(locale, "Kaydediliyor…", "Saving…") : tx(locale, "Siparişi oluştur", "Create the order")}
        </button>
      </form>
    );
  }

  return (
    <div className="iban-pay">
      <p className="pay__order">
        <span>{title}</span>
        <strong className="num">{order ? order.code : "…"}</strong>
        {status && <span className={`pill pill--${status}`}>{statusText}</span>}
      </p>
      <p className="pay__total">{tx(locale, "Ödenecek tutar", "Amount to pay")} <strong className="num">{formatTL(total, locale)}</strong></p>

      {canPay && order && (
        <>
          {status === "reddedildi" && (
            <div className="alert alert--error" role="alert">
              <Icon name="alert" size={18} />
              <span>{order.adminNote || tx(locale, "Ödeme onaylanmadı. Kartla yeniden deneyebilirsiniz.", "The payment was not confirmed. You can try again by card.")}</span>
            </div>
          )}
          <a className="btn btn--dark btn--lg btn--block btn--serif" href={`/api/siparis/${encodeURIComponent(order.code)}/shopier?email=${encodeURIComponent(order.customer.email)}`}>
            <Icon name="lock" size={16} /> {tx(locale, "Kart ile öde", "Pay by card")}
          </a>
          <a className="btn btn--outline btn--block" href={`/api/siparis/${encodeURIComponent(order.code)}/shopier?email=${encodeURIComponent(order.customer.email)}&yeni=1`}>
            {tx(locale, "Ödeme sayfası açılmazsa yeniden dene", "Try again if the payment page does not open")}
          </a>
          <p className="field__hint">
            {tx(
              locale,
              "Kart bilgisi Shopier sayfasında girilir. Ödeme onaylanınca sipariş kendiliğinden açılır. Bu ekrana geri dönebilirsiniz.",
              "Card details are entered on Shopier. The order opens on its own once the payment is confirmed. You can come back to this screen.",
            )}
          </p>
        </>
      )}

      {!cat.cardPayments && status !== "onaylandi" && order?.total !== 0 && (
        <div className="alert alert--warn" role="status">
          <Icon name="alert" size={18} />
          <span>{tx(locale, "Kart ödemesi henüz açılmadı.", "Card payment is not open yet.")}</span>
        </div>
      )}

      {support && status !== "onaylandi" && (
        <p className="field__hint">
          {tx(locale, "Destek:", "Support:")} {cat.settings.supportPhone} {cat.settings.supportEmail && <a href={`mailto:${cat.settings.supportEmail}`}>{cat.settings.supportEmail}</a>}
        </p>
      )}

      {status === "bildirildi" && (
        <div className="alert alert--success" role="status">
          <Icon name="check" size={18} />
          <span>
            {tx(locale, "Ödemeniz kontrol edilip onaylanacaktır.", "Your payment will be checked and confirmed.")}
            {" "}
            {tx(locale, "Sipariş kodu:", "Order code:")} <strong className="num">{order?.code}</strong>
          </span>
        </div>
      )}

      {status === "onaylandi" && (
        <div className="pay-done" role="status">
          <span className="pay-done__icon"><Icon name="check" size={28} /></span>
          <h2>{tx(locale, "Ödeme onaylandı", "Payment confirmed")}</h2>
          <p>
            {order?.adminNote || tx(locale, "Siparişiniz onaylandı. Davetiyeniz hazırlanırken bu kodu saklayın: ", "Your order is confirmed. Keep this code while your invitation is prepared: ")}
            {order?.adminNote ? null : <strong className="num">{order?.code}</strong>}
          </p>
          <div className="pay-done__cta">
            {kind === "davetiye" && (
              <Link href={withLocaleQuery(locale, `/onizleme/tema/${template}?taslak=1`)} className="btn btn--dark btn--lg btn--serif">{tx(locale, "Davetiyemi önizle", "Preview my invitation")}</Link>
            )}
            <Link href="/panel" className="btn btn--outline btn--lg">{tx(locale, "Panelime git", "Go to my account")}</Link>
          </div>
        </div>
      )}

      <ShareLinkCard share={share} locale={locale} />

      {order && (
        <ul className="timeline">
          <li>{tx(locale, "Oluşturuldu", "Created")} · <time dateTime={order.createdAt}>{stamp(order.createdAt, locale)}</time></li>
          {order.decidedAt && <li>{tx(locale, "Sonuçlandı", "Decided")} · <time dateTime={order.decidedAt}>{stamp(order.decidedAt, locale)}</time></li>}
        </ul>
      )}
    </div>
  );
}
