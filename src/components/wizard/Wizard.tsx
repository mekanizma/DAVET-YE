"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "../Icon";
import Logo from "../Logo";
import StepEvent from "./StepEvent";
import StepInfo from "./StepInfo";
import StepLanguages from "./StepLanguages";
import StepPayment from "./StepPayment";
import StepReview from "./StepReview";
import StepTemplate from "./StepTemplate";
import { firstIncompleteBefore, gapSentence, infoIssues, validateStep, type Errors } from "./validate";
import { useCatalog } from "@/components/CatalogProvider";
import { getTheme } from "@/data/themes";
import { themeTitle } from "@/i18n/catalog";
import { lp, type Locale } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { useLocale } from "@/i18n/provider";
import { formatTL } from "@/lib/format";
import { priceLines, priceTotal } from "@/lib/pricing";
import { saveDraft, useDraft, type WizardStepId } from "@/lib/storage";
import { wizardSteps } from "@/lib/wizardSteps";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function titles(locale: Locale): Record<WizardStepId, { h: string; sub: string }> {
  const en = locale === "en";
  return {
    etkinlik: {
      h: en ? "Which occasion is this invitation for?" : "Hangi özel gün için davetiye hazırlıyorsunuz?",
      sub: en ? "Choose your event, and the next step will show the invitations that fit it." : "Etkinliğinizi seçin; bir sonraki adımda ona uygun davetiyeleri gösterelim.",
    },
    sablon: {
      h: en ? "Choose an invitation" : "Bir davetiye seçin",
      sub: en ? "Tap the invitation you like. You will set the languages and the details for it in the next steps." : "Beğendiğiniz davetiyeye dokunarak seçin. Dilleri ve bilgileri sonraki adımlarda bu davetiyeye göre düzenlersiniz.",
    },
    diller: {
      h: en ? "Invitation language" : "Davetiye dili",
      sub: en ? "Choose the main language. Add extra languages if you would like guests to read it in another language too." : "Davetiyenin ana dilini seçin. Misafirleriniz farklı dillerde de okuyabilsin isterseniz ek dil ekleyebilirsiniz.",
    },
    bilgiler: {
      h: en ? "Enter your details" : "Bilgilerinizi girin",
      sub: en ? "You see them on the phone as you type. The fields are grouped by page; tap a group and the preview moves to that page." : "Yazdıkça telefonda görürsünüz. Alanlar sayfalara göre gruplanmıştır; bir gruba dokunduğunuzda önizleme o sayfaya gider.",
    },
    kontrol: {
      h: en ? "Final check" : "Son kontrol",
      sub: en ? "Review the details. Anything still missing must be completed before payment." : "Bilgileri gözden geçirin. Eksik kalanlar ödemeden önce tamamlanmalı.",
    },
    odeme: {
      h: en ? "Pay by bank transfer" : "Havale ile ödeme",
      sub: en ? "Send the amount to the IBAN, and write the order code in the reference." : "Tutarı IBAN’a gönderin, sipariş kodunu açıklamaya yazın.",
    },
  };
}

export default function Wizard({ step, sablon }: { step: WizardStepId; sablon?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const cat = useCatalog();
  const { draft, ready } = useDraft();
  const [errors, setErrors] = useState<Errors>({});
  const [seeded, setSeeded] = useState(false);
  const [totalOpen, setTotalOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const steps = wizardSteps(locale);
  const base = lp(locale, "/davetiye-olustur");
  const copy = marketing(locale);
  const heading = titles(locale)[step];

  const idx = steps.findIndex((s) => s.id === step);
  const prev = steps[idx - 1];
  const next = steps[idx + 1];
  const gaps = infoIssues(draft, locale);
  const gapCount = Object.keys(gaps).length;

  useEffect(() => {
    if (!ready || seeded) return;
    const t = sablon ? getTheme(sablon) : undefined;
    if (t && draft.template !== t.slug) {
      saveDraft({
        template: t.slug,
        event: draft.event && t.eventTypes.includes(draft.event) ? draft.event : t.eventTypes[0] ?? "nisan-dugun",
        order: null,
      });
    }
    setSeeded(true);
  }, [ready, seeded, sablon, draft.template, draft.event]);

  const blocker = ready && seeded ? firstIncompleteBefore(step, draft, steps, locale) : null;
  const payBlock = step === "odeme" && !blocker ? (gapCount ? "bilgiler" : !draft.termsAccepted ? "kontrol" : null) : null;
  useEffect(() => {
    if (!ready || !seeded) return;
    const target = blocker || payBlock;
    if (target) router.replace(`${base}/${target}`);
  }, [ready, seeded, blocker, payBlock, router, base]);

  useEffect(() => {
    setErrors({});
    setTotalOpen(false);
    const focus = new URLSearchParams(window.location.search).get("alan");
    if (!focus) window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  function stepOpen(i: number) {
    if (i <= idx) return true;
    const id = steps[i].id;
    if (id === "odeme") return gapCount === 0 && draft.termsAccepted && !!draft.template;
    if (id === "diller" || id === "bilgiler" || id === "kontrol") return !!draft.template;
    if (id === "sablon") return !!draft.event;
    return false;
  }

  function continueDisabled() {
    if (step === "etkinlik") return !draft.event;
    if (step === "sablon") return !draft.template;
    if (step === "kontrol") return gapCount > 0 || !draft.termsAccepted;
    return false;
  }

  function hint() {
    if (step === "etkinlik" && !draft.event) return tx(locale, "Devam etmek için bir etkinlik tipi seçin.", "Choose an event type to continue.");
    if (step === "sablon" && !draft.template) return tx(locale, "Devam etmek için bir davetiye seçin.", "Choose an invitation to continue.");
    if (step === "kontrol" && gapCount) return gapSentence(gapCount, locale);
    if (step === "kontrol" && !draft.termsAccepted) return tx(locale, "Devam etmek için koşulları kabul edin.", "Accept the terms to continue.");
    return "";
  }

  function goNext() {
    const e = validateStep(step, draft, locale);
    if (step === "kontrol") Object.assign(e, infoIssues(draft, locale));
    setErrors(e);
    if (Object.keys(e).length || continueDisabled()) return;
    if (next) router.push(`${base}/${next.id}`);
  }

  const theme = draft.template ? getTheme(draft.template) : undefined;
  const themeName = theme ? themeTitle(theme, locale) : "";
  const lines = priceLines(draft, cat, locale);
  const total = priceTotal(draft, cat, locale);
  const previewSrc = theme
    ? `/onizleme/tema/${theme.slug}?embed=1&taslak=1${draft.event === "coklu" ? "&mod=kina-dugun" : ""}&v=${previewKey}`
    : "";
  const disabled = continueDisabled();

  return (
    <div className="studio">
      <header className="studio__bar">
        <div className="studio__brand">
          <Logo width={118} priority />
          <p>{tx(locale, "Davetiye oluştur", "Create an invitation")}</p>
        </div>
        <div className="studio__tools">
          <p className="studio__saved" role="status">
            <Icon name="check" size={14} /> {draft.updatedAt ? tx(locale, "Kaydedildi", "Saved") : tx(locale, "Taslak", "Draft")}
          </p>
          <div className="studio__total">
            <button
              type="button"
              className="studio__total-btn"
              aria-expanded={totalOpen}
              onClick={() => setTotalOpen((v) => !v)}
            >
              {tx(locale, "Toplam", "Total")} <strong className="num">{formatTL(total, locale)}</strong>
              <Icon name="chevron-down" size={14} />
            </button>
            {totalOpen && (
              <div className="studio__total-pop">
                <ul>
                  {lines.map((l) => (
                    <li key={l.id}>
                      <span>{l.label}</span>
                      <span className="num">{l.amount === 0 ? copy.free : formatTL(l.amount, locale)}</span>
                    </li>
                  ))}
                </ul>
                <p><span>{tx(locale, "Toplam", "Total")}</span><strong className="num">{formatTL(total, locale)}</strong></p>
              </div>
            )}
          </div>
          <Link href={`/${locale}`} className="studio__exit" aria-label={tx(locale, "Kaydet ve çık", "Save and exit")}>
            <Icon name="close" size={18} />
          </Link>
        </div>
      </header>

      <nav className="studio__steps" aria-label={tx(locale, "Davetiye oluşturma adımları", "Steps to create an invitation")}>
        <ol>
          {steps.map((s, i) => {
            const state = i < idx ? "done" : i === idx ? "current" : "todo";
            const open = ready && stepOpen(i) && i !== idx;
            return (
              <li key={s.id} className={`is-${state}${state === "todo" && !open ? " is-locked" : ""}`}>
                {open ? (
                  <Link href={`${base}/${s.id}`}>
                    <span>{i < idx ? <Icon name="check" size={12} /> : i + 1}</span>
                    {s.label}
                  </Link>
                ) : (
                  <span aria-current={state === "current" ? "step" : undefined} aria-disabled={state !== "current" || undefined}>
                    <span>{i < idx ? <Icon name="check" size={12} /> : i + 1}</span>
                    {s.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="studio__layout">
        <main id="main" className="studio__main" data-step={step} tabIndex={-1}>
          <p className="studio__kicker">{tx(locale, `Adım ${idx + 1} / ${steps.length}`, `Step ${idx + 1} of ${steps.length}`)}</p>
          <h1>{heading.h}</h1>
          <p className="studio__sub">{heading.sub}</p>

          {!ready || !seeded || blocker || payBlock ? (
            <p className="wz-loading" role="status">{blocker || payBlock ? tx(locale, "Önceki adıma yönlendiriliyorsunuz…", "Taking you back to the previous step…") : tx(locale, "Yükleniyor…", "Loading…")}</p>
          ) : (
            <>
              {step === "etkinlik" && <StepEvent draft={draft} errors={errors} />}
              {step === "sablon" && <StepTemplate draft={draft} errors={errors} />}
              {step === "diller" && <StepLanguages draft={draft} errors={errors} />}
              {step === "bilgiler" && <StepInfo draft={draft} errors={{ ...gaps, ...errors }} />}
              {step === "kontrol" && <StepReview draft={draft} errors={errors} />}
              {step === "odeme" && <StepPayment draft={draft} title={themeName || tx(locale, "Davetiye", "Invitation")} />}
            </>
          )}
        </main>

        <aside className="studio__aside" aria-label={tx(locale, "Davetiye önizlemesi", "Invitation preview")}>
          <div className="studio__phone">
            {theme ? (
              <>
                <div className="studio__phone-actions">
                  <button type="button" aria-label={tx(locale, "Açılışı oynat", "Play the opening")} onClick={() => setPreviewKey((n) => n + 1)}>
                    <Icon name="arrow" size={16} />
                  </button>
                  <Link href={`/onizleme/tema/${theme.slug}?taslak=1`} target="_blank" rel="noopener noreferrer" aria-label={tx(locale, "Yeni sekmede aç", "Open in a new tab")}>
                    <Icon name="expand" size={16} />
                  </Link>
                </div>
                <div className="studio__phone-frame">
                  <iframe key={previewSrc} title={tx(locale, `${themeName} önizlemesi`, `${themeName} preview`)} src={previewSrc} />
                </div>
              </>
            ) : (
              <div className="studio__phone-empty">
                <strong>{tx(locale, "Canlı önizleme", "Live preview")}</strong>
                <p>{tx(locale, "Bir davetiye seçtiğinizde burada canlı olarak görünür.", "Once you choose an invitation, it appears here live.")}</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {ready && seeded && !blocker && !payBlock && next && (
        <div className="studio__nav">
          {prev ? (
            <Link href={`${base}/${prev.id}`} className="btn btn--outline studio__back">
              <Icon name="chevron-left" size={16} /> {tx(locale, "Geri", "Back")}
            </Link>
          ) : (
            <Link href={lp(locale, "/temalar")} className="btn btn--outline studio__back">
              <Icon name="chevron-left" size={16} /> {tx(locale, "Geri", "Back")}
            </Link>
          )}
          <p className="studio__hint" role="status">
            {theme && step !== "etkinlik" ? <span className="studio__picked">{tx(locale, `“${themeName}” seçildi.`, `“${themeName}” selected.`)}</span> : null}
            {hint()}
          </p>
          <button type="button" className="btn btn--dark btn--serif studio__next" onClick={goNext} disabled={disabled} aria-disabled={disabled}>
            {tx(locale, `Devam: ${next.label}`, `Continue: ${next.label}`)} <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
