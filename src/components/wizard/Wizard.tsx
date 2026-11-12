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
import { firstIncompleteBefore, infoIssues, validateStep, type Errors } from "./validate";
import { useCatalog } from "@/components/CatalogProvider";
import { getTheme } from "@/data/themes";
import { formatTL } from "@/lib/format";
import { priceLines, priceTotal } from "@/lib/pricing";
import { saveDraft, useDraft, WIZARD_STEPS, type WizardStepId } from "@/lib/storage";

const BASE = "/tr/davetiye-olustur";

const TITLES: Record<WizardStepId, { h: string; sub: string }> = {
  etkinlik: {
    h: "Hangi özel gün için davetiye hazırlıyorsunuz?",
    sub: "Etkinliğinizi seçin; bir sonraki adımda ona uygun davetiyeleri gösterelim.",
  },
  sablon: {
    h: "Bir davetiye seçin",
    sub: "Beğendiğiniz davetiyeye dokunarak seçin. Dilleri ve bilgileri sonraki adımlarda bu davetiyeye göre düzenlersiniz.",
  },
  diller: {
    h: "Davetiye dili",
    sub: "Davetiyenin ana dilini seçin. Misafirleriniz farklı dillerde de okuyabilsin isterseniz ek dil ekleyebilirsiniz.",
  },
  bilgiler: {
    h: "Bilgilerinizi girin",
    sub: "Yazdıkça telefonda görürsünüz. Alanlar sayfalara göre gruplanmıştır; bir gruba dokunduğunuzda önizleme o sayfaya gider.",
  },
  kontrol: {
    h: "Son kontrol",
    sub: "Bilgileri gözden geçirin. Eksik kalanlar ödemeden önce tamamlanmalı.",
  },
  odeme: {
    h: "Havale ile ödeme",
    sub: "Tutarı IBAN’a gönderin, sipariş kodunu açıklamaya yazın.",
  },
};

export default function Wizard({ step, sablon }: { step: WizardStepId; sablon?: string }) {
  const router = useRouter();
  const cat = useCatalog();
  const { draft, ready } = useDraft();
  const [errors, setErrors] = useState<Errors>({});
  const [seeded, setSeeded] = useState(false);
  const [totalOpen, setTotalOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const idx = WIZARD_STEPS.findIndex((s) => s.id === step);
  const prev = WIZARD_STEPS[idx - 1];
  const next = WIZARD_STEPS[idx + 1];
  const gaps = infoIssues(draft);
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

  const blocker = ready && seeded ? firstIncompleteBefore(step, draft, WIZARD_STEPS) : null;
  const payBlock = step === "odeme" && !blocker ? (gapCount ? "bilgiler" : !draft.termsAccepted ? "kontrol" : null) : null;
  useEffect(() => {
    if (!ready || !seeded) return;
    const target = blocker || payBlock;
    if (target) router.replace(`${BASE}/${target}`);
  }, [ready, seeded, blocker, payBlock, router]);

  useEffect(() => {
    setErrors({});
    setTotalOpen(false);
    const focus = new URLSearchParams(window.location.search).get("alan");
    if (!focus) window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  function stepOpen(i: number) {
    if (i <= idx) return true;
    const id = WIZARD_STEPS[i].id;
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
    if (step === "etkinlik" && !draft.event) return "Devam etmek için bir etkinlik tipi seçin.";
    if (step === "sablon" && !draft.template) return "Devam etmek için bir davetiye seçin.";
    if (step === "kontrol" && gapCount) return `Ödemeden önce ${gapCount} eksik bilgi tamamlanmalı.`;
    if (step === "kontrol" && !draft.termsAccepted) return "Devam etmek için koşulları kabul edin.";
    return "";
  }

  function goNext() {
    const e = validateStep(step, draft);
    if (step === "kontrol") Object.assign(e, infoIssues(draft));
    setErrors(e);
    if (Object.keys(e).length || continueDisabled()) return;
    if (next) router.push(`${BASE}/${next.id}`);
  }

  const theme = draft.template ? getTheme(draft.template) : undefined;
  const lines = priceLines(draft, cat);
  const total = priceTotal(draft, cat);
  const previewSrc = theme
    ? `/onizleme/tema/${theme.slug}?embed=1&taslak=1${draft.event === "coklu" ? "&mod=kina-dugun" : ""}&v=${previewKey}`
    : "";
  const disabled = continueDisabled();

  return (
    <div className="studio">
      <header className="studio__bar">
        <div className="studio__brand">
          <Logo width={118} priority />
          <p>Davetiye oluştur</p>
        </div>
        <div className="studio__tools">
          <p className="studio__saved" role="status">
            <Icon name="check" size={14} /> {draft.updatedAt ? "Kaydedildi" : "Taslak"}
          </p>
          <div className="studio__total">
            <button
              type="button"
              className="studio__total-btn"
              aria-expanded={totalOpen}
              onClick={() => setTotalOpen((v) => !v)}
            >
              Toplam <strong className="num">{formatTL(total)}</strong>
              <Icon name="chevron-down" size={14} />
            </button>
            {totalOpen && (
              <div className="studio__total-pop">
                <ul>
                  {lines.map((l) => (
                    <li key={l.id}>
                      <span>{l.label}</span>
                      <span className="num">{l.amount === 0 ? "Ücretsiz" : formatTL(l.amount)}</span>
                    </li>
                  ))}
                </ul>
                <p><span>Toplam</span><strong className="num">{formatTL(total)}</strong></p>
              </div>
            )}
          </div>
          <Link href="/tr" className="studio__exit" aria-label="Kaydet ve çık">
            <Icon name="close" size={18} />
          </Link>
        </div>
      </header>

      <nav className="studio__steps" aria-label="Davetiye oluşturma adımları">
        <ol>
          {WIZARD_STEPS.map((s, i) => {
            const state = i < idx ? "done" : i === idx ? "current" : "todo";
            const open = ready && stepOpen(i) && i !== idx;
            return (
              <li key={s.id} className={`is-${state}${state === "todo" && !open ? " is-locked" : ""}`}>
                {open ? (
                  <Link href={`${BASE}/${s.id}`}>
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
          <p className="studio__kicker">Adım {idx + 1} / {WIZARD_STEPS.length}</p>
          <h1>{TITLES[step].h}</h1>
          <p className="studio__sub">{TITLES[step].sub}</p>

          {!ready || !seeded || blocker || payBlock ? (
            <p className="wz-loading" role="status">{blocker || payBlock ? "Önceki adıma yönlendiriliyorsunuz…" : "Yükleniyor…"}</p>
          ) : (
            <>
              {step === "etkinlik" && <StepEvent draft={draft} errors={errors} />}
              {step === "sablon" && <StepTemplate draft={draft} errors={errors} />}
              {step === "diller" && <StepLanguages draft={draft} errors={errors} />}
              {step === "bilgiler" && <StepInfo draft={draft} errors={{ ...gaps, ...errors }} />}
              {step === "kontrol" && <StepReview draft={draft} errors={errors} />}
              {step === "odeme" && <StepPayment draft={draft} title={theme?.title ?? "Davetiye"} />}
            </>
          )}
        </main>

        <aside className="studio__aside" aria-label="Davetiye önizlemesi">
          <div className="studio__phone">
            {theme ? (
              <>
                <div className="studio__phone-actions">
                  <button type="button" aria-label="Açılışı oynat" onClick={() => setPreviewKey((n) => n + 1)}>
                    <Icon name="arrow" size={16} />
                  </button>
                  <Link href={`/onizleme/tema/${theme.slug}?taslak=1`} target="_blank" rel="noopener noreferrer" aria-label="Yeni sekmede aç">
                    <Icon name="expand" size={16} />
                  </Link>
                </div>
                <div className="studio__phone-frame">
                  <iframe key={previewSrc} title={`${theme.title} önizlemesi`} src={previewSrc} />
                </div>
              </>
            ) : (
              <div className="studio__phone-empty">
                <strong>Canlı önizleme</strong>
                <p>Bir davetiye seçtiğinizde burada canlı olarak görünür.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {ready && seeded && !blocker && !payBlock && next && (
        <div className="studio__nav">
          {prev ? (
            <Link href={`${BASE}/${prev.id}`} className="btn btn--outline studio__back">
              <Icon name="chevron-left" size={16} /> Geri
            </Link>
          ) : (
            <Link href="/tr/temalar" className="btn btn--outline studio__back">
              <Icon name="chevron-left" size={16} /> Geri
            </Link>
          )}
          <p className="studio__hint" role="status">
            {theme && step !== "etkinlik" ? <span className="studio__picked">“{theme.title}” seçildi.</span> : null}
            {hint()}
          </p>
          <button type="button" className="btn btn--dark btn--serif studio__next" onClick={goNext} disabled={disabled} aria-disabled={disabled}>
            Devam: {next.label} <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
