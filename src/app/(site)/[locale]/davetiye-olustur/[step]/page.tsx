import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Wizard from "@/components/wizard/Wizard";
import { isLocale, LOCALES } from "@/i18n/locale";
import { WIZARD_STEPS, type WizardStepId } from "@/lib/wizardSteps";

const STEP_EN: Record<WizardStepId, string> = {
  etkinlik: "Event",
  sablon: "Invitation",
  diller: "Languages",
  bilgiler: "Details",
  kontrol: "Review",
  odeme: "Payment",
};

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => WIZARD_STEPS.map((s) => ({ locale, step: s.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; step: string }>;
}): Promise<Metadata> {
  const { locale, step } = await params;
  if (!isLocale(locale)) notFound();
  const s = WIZARD_STEPS.find((x) => x.id === step);
  const title =
    locale === "en"
      ? s
        ? `Create an invitation · ${STEP_EN[s.id]}`
        : "Create an invitation"
      : s
        ? `Davetiye oluştur · ${s.title}`
        : "Davetiye oluştur";
  return { title, robots: { index: false } };
}

export default async function WizardStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; step: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, step } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  if (!WIZARD_STEPS.some((s) => s.id === step)) notFound();
  const sablon = typeof sp.sablon === "string" ? sp.sablon : undefined;
  return <Wizard step={step as WizardStepId} sablon={sablon} />;
}
