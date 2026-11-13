"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import Icon from "../Icon";
import { TextAreaField, TextField } from "../Field";
import { IbanCard } from "./IbanCard";
import { useCatalog } from "@/components/CatalogProvider";
import { useLocale } from "@/i18n/provider";
import { withLocaleQuery, type Locale } from "@/i18n/locale";
import { localizeError, statusLabel } from "@/i18n/product";
import { formatTL, isEmail } from "@/lib/format";
import type { PaymentSettings } from "@/lib/catalog";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orderStatus";
import type { OrderRecord } from "@/lib/orderTypes";

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
}) {
  const locale = useLocale();
  const cat = useCatalog();
  const [phase, setPhase] = useState<Phase>(resume?.code ? "pay" : "form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(resume?.email ?? "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sender, setSender] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>(cat.settings);
  const [ready, setReady] = useState(cat.paymentReady);

  useEffect(() => {
    if (!resume?.code || !resume.email) return;
    let cancelled = false;
    let timer = 0;
    async function load(silent = false) {
      const res = await fetch(`/api/siparis/${encodeURIComponent(resume!.code)}?email=${encodeURIComponent(resume!.email)}`);
      if (cancelled) return;
      if (!res.ok) {
        if (!silent) {
          setFailure("");
          setPhase("form");
        }
        return false;
      }
      const data = await res.json();
      if (cancelled) return;
      setOrder(data.order);
      setSettings(data.settings);
      setReady(data.paymentReady);
      if (!silent) setSender("");
      setPhase("pay");
      onUpdate?.({
        code: data.order.code,
        status: data.order.status,
        at: data.order.createdAt,
        total: data.order.total,
        email: data.order.customer.email,
      });
      return true;
    }
    load().then((found) => {
      if (!cancelled && found) timer = window.setInterval(() => load(true), 15000);
    });
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // resume identity is stable enough for this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.code, resume?.email]);

  function remember(o: OrderRecord) {
    setOrder(o);
    onUpdate?.({ code: o.code, status: o.status, at: o.createdAt, total: o.total, email: o.customer.email });
  }

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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFailure(localizeError(data.error || "Sipariş kaydedilemedi.", locale));
        return;
      }
      setSettings(data.settings);
      setReady(data.paymentReady);
      remember(data.order);
      setSender("");
      setFile(null);
      setPhase("pay");
    } catch {
      setFailure(tx(locale, "Bağlantı kurulamadı. Yeniden deneyin.", "The connection could not be made. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function report(ev: FormEvent) {
    ev.preventDefault();
    if (!order) return;
    const receipt = file;
    const er: Record<string, string> = {};
    if (sender.trim().length < 3) er.sender = tx(locale, "Ad soyad yazın.", "Enter your full name.");
    if (!receipt) er.dekont = tx(locale, "Dekont yükleyin.", "Upload a receipt.");
    else if (receipt.size > 5 * 1024 * 1024) er.dekont = localizeError("Dekont JPG, PNG, WEBP veya PDF olmalı ve 5 MB’ı geçmemeli.", locale);
    setErrors(er);
    if (Object.keys(er).length || !receipt) return;
    setBusy(true);
    setFailure("");
    try {
      const body = new FormData();
      body.set("email", order.customer.email);
      body.set("senderName", sender.trim());
      body.set("dekont", receipt);
      const res = await fetch(`/api/siparis/${encodeURIComponent(order.code)}`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setFailure(localizeError(data.error || "Bildirim kaydedilemedi.", locale));
        return;
      }
      remember(data.order);
      setErrors({});
      setFile(null);
    } catch {
      setFailure(tx(locale, "Bağlantı kurulamadı. Yeniden deneyin.", "The connection could not be made. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  const status = order?.status as OrderStatus | undefined;
  const total = order?.total ?? previewTotal;
  const receiptSent = Boolean(order?.snapshot?.__dekont);
  const showNotify = status === "bekliyor" || status === "reddedildi" || (status === "bildirildi" && !receiptSent);
  const canSend = sender.trim().length >= 3 && Boolean(file) && ready && !busy;
  const statusText = status ? statusLabel(status, locale, STATUS_LABEL[status] ?? status) : "";

  if (phase === "form") {
    return (
      <form className="iban-pay" onSubmit={create} noValidate>
        <div className="alert alert--info" role="note">
          <Icon name="info" size={18} />
          <span>
            {locale === "en" ? (
              <>
                Payment is by <strong>bank transfer</strong> only. Card details are never asked for. After the order code is created, write the amount and the code in the transfer reference.
              </>
            ) : (
              <>
                Ödeme yalnızca <strong>havale veya EFT</strong> ile alınır. Kart bilgisi istenmez. Sipariş kodu oluştuktan
                sonra tutarı ve kodu açıklamaya yazmanız gerekir.
              </>
            )}
          </span>
        </div>
        {!ready && (
          <div className="alert alert--warn" role="status">
            <Icon name="alert" size={18} />
            <span>{tx(locale, "Havale hesabı henüz yayınlanmadı. Siparişinizi yine de oluşturabilirsiniz; hesap eklendiğinde bu ekranda görünür.", "The transfer account has not been published yet. You can still place the order; the account appears on this screen once it is added.")}</span>
          </div>
        )}
        <p className="pay__total">{tx(locale, "Ödenecek tutar", "Amount to pay")} <strong className="num">{formatTL(previewTotal, locale)}</strong></p>
        <TextField id="pay-name" label={tx(locale, "Ad soyad", "Full name")} required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
        <TextField id="pay-mail" type="email" label={tx(locale, "E-posta", "Email")} required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" inputMode="email" hint={tx(locale, "Sipariş durumunu bu adresle sorgularsınız.", "You look up the order status with this address.")} />
        <TextField id="pay-phone" type="tel" label={tx(locale, "Telefon", "Phone")} required value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" />
        <TextAreaField id="pay-note" label={tx(locale, "Not (isteğe bağlı)", "Note (optional)")} value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} />
        {failure && <div className="alert alert--error" role="alert"><Icon name="alert" size={18} /><span>{failure}</span></div>}
        <button type="submit" className="btn btn--dark btn--lg btn--block btn--serif" disabled={busy}>
          <Icon name="envelope" size={16} /> {busy ? tx(locale, "Kaydediliyor…", "Saving…") : tx(locale, "Siparişi oluştur", "Create the order")}
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

      {order?.total === 0 || status === "onaylandi" ? null : (
        <ol className="iban-steps">
          <li>{tx(locale, "Aşağıdaki hesaba sipariş tutarının tamamını havale veya EFT ile gönderin.", "Send the full order amount to the account below by bank transfer.")}</li>
          <li>{tx(locale, "Açıklama kısmına yalnızca sipariş kodunu yazın. Kod olmadan ödeme eşleşmeyebilir.", "Write only the order code in the reference. Without the code, the payment may not be matched.")}</li>
          <li>{tx(locale, "Ad soyadınızı ve dekontu gönderin. Ödeme sistem tarafından kontrol edilip onaylanır. Karttan çekim yapılmaz.", "Send your full name and the receipt. The payment is checked and confirmed by the system. Nothing is charged to a card.")}</li>
        </ol>
      )}

      {status !== "onaylandi" && <IbanCard settings={settings} total={total} code={order?.code} title={title} />}
      {settings.instructions && status !== "onaylandi" && <p className="field__hint">{settings.instructions}</p>}
      {(settings.supportEmail || settings.supportPhone) && (
        <p className="field__hint">
          {tx(locale, "Destek:", "Support:")} {settings.supportPhone} {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>}
        </p>
      )}

      {showNotify ? (
        <form onSubmit={report} noValidate>
          {status === "reddedildi" && (
            <div className="alert alert--error" role="alert">
              <Icon name="alert" size={18} />
              <span>{order?.adminNote || tx(locale, "Ödeme onaylanmadı. Havale bilgilerinizi kontrol edip yeniden bildirin.", "The payment was not confirmed. Check the transfer details and send them again.")}</span>
            </div>
          )}
          <TextField id="pay-sender" label={tx(locale, "Ad soyad", "Full name")} required value={sender} onChange={(e) => setSender(e.target.value)} error={errors.sender} autoComplete="name" hint={tx(locale, "Dekonttaki gönderen adıyla aynı olsun.", "Use the same name as the sender on the receipt.")} />
          <div className="dekont">
            <label htmlFor="pay-dekont">{tx(locale, "Dekont", "Receipt")}</label>
            <input
              id="pay-dekont"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setErrors((prev) => ({ ...prev, dekont: "" }));
              }}
            />
            <small>{file ? file.name : tx(locale, "Fotoğraf veya PDF seçin. En fazla 5 MB.", "Choose a photograph or a PDF. 5 MB at most.")}</small>
            {errors.dekont && <p className="field__error" role="alert">{errors.dekont}</p>}
            {preview && <img className="dekont__preview" src={preview} alt={tx(locale, "Seçilen dekontun önizlemesi", "Preview of the selected receipt")} />}
          </div>
          {failure && <div className="alert alert--error" role="alert"><Icon name="alert" size={18} /><span>{failure}</span></div>}
          <button type="submit" className="btn btn--dark btn--lg btn--block btn--serif" disabled={!canSend}>
            {busy ? tx(locale, "Gönderiliyor…", "Sending…") : status === "reddedildi" ? tx(locale, "Yeniden gönder", "Send again") : tx(locale, "Gönder", "Send")}
          </button>
          {!ready && <p className="field__hint">{tx(locale, "Hesap bilgisi yayınlanmadan havale bildirimi kapalıdır.", "A transfer notice stays closed until the account details are published.")}</p>}
        </form>
      ) : null}

      {status === "bildirildi" && receiptSent && (
        <div className="alert alert--success" role="status">
          <Icon name="check" size={18} />
          <span>
            {tx(locale, "Ödemeniz sistem tarafından kontrol edilip onaylanacaktır.", "Your payment will be checked and confirmed by the system.")}
            {order?.senderName ? ` ${tx(locale, "Gönderen:", "Sender:")} ${order.senderName}.` : ""} {tx(locale, "Sipariş kodu:", "Order code:")} <strong className="num">{order?.code}</strong>
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

      {order && (
        <ul className="timeline">
          <li>{tx(locale, "Oluşturuldu", "Created")} · <time dateTime={order.createdAt}>{stamp(order.createdAt, locale)}</time></li>
          {order.reportedAt && <li>{tx(locale, "Havale bildirildi", "Transfer reported")} · <time dateTime={order.reportedAt}>{stamp(order.reportedAt, locale)}</time></li>}
          {order.decidedAt && <li>{tx(locale, "Sonuçlandı", "Decided")} · <time dateTime={order.decidedAt}>{stamp(order.decidedAt, locale)}</time></li>}
        </ul>
      )}
    </div>
  );
}
