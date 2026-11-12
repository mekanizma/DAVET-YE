export const WIZARD_STEPS = [
  { id: "etkinlik", label: "Etkinlik", title: "Etkinlik" },
  { id: "sablon", label: "Davetiye", title: "Davetiye" },
  { id: "diller", label: "Diller", title: "Diller" },
  { id: "bilgiler", label: "Bilgiler", title: "Bilgiler" },
  { id: "kontrol", label: "Kontrol", title: "Kontrol" },
  { id: "odeme", label: "Ödeme", title: "Ödeme" },
] as const;
export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];
