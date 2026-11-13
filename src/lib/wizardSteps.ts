import type { Locale } from "@/i18n/locale";

export const WIZARD_STEPS = [
  { id: "etkinlik", label: "Etkinlik", title: "Etkinlik" },
  { id: "sablon", label: "Davetiye", title: "Davetiye" },
  { id: "diller", label: "Diller", title: "Diller" },
  { id: "bilgiler", label: "Bilgiler", title: "Bilgiler" },
  { id: "kontrol", label: "Kontrol", title: "Kontrol" },
  { id: "odeme", label: "Ödeme", title: "Ödeme" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

const STEP_EN: Record<WizardStepId, { label: string; title: string }> = {
  etkinlik: { label: "Event", title: "Event" },
  sablon: { label: "Invitation", title: "Invitation" },
  diller: { label: "Languages", title: "Languages" },
  bilgiler: { label: "Details", title: "Details" },
  kontrol: { label: "Review", title: "Review" },
  odeme: { label: "Payment", title: "Payment" },
};

export function wizardSteps(locale: Locale): { id: WizardStepId; label: string; title: string }[] {
  return WIZARD_STEPS.map((step) =>
    locale === "en" ? { id: step.id, label: STEP_EN[step.id].label, title: STEP_EN[step.id].title } : { id: step.id, label: step.label, title: step.title },
  );
}
