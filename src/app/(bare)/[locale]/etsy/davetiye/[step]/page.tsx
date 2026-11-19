import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Wizard from "@/components/wizard/Wizard";
import { isLocale } from "@/i18n/locale";
import { ETSY_COOKIE, readEtsySession } from "@/lib/etsySession";
import { getEtsyCode, isEtsyOpenChoice } from "@/lib/etsyStore";
import { WIZARD_STEPS, type WizardStepId } from "@/lib/wizardSteps";

const ETSY_STEPS: WizardStepId[] = ["diller", "bilgiler", "kontrol", "odeme"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; step: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: locale === "en" ? "Design your free invitation" : "Ücretsiz davetiyenizi tasarlayın",
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ebe4d8",
  viewportFit: "cover",
};

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; step: string }>;
}) {
  const { locale, step } = await params;
  if (!isLocale(locale)) notFound();
  if (!WIZARD_STEPS.some((s) => s.id === step) || !ETSY_STEPS.includes(step as WizardStepId)) {
    redirect(`/${locale}/etsy/davetiye/diller`);
  }

  const jar = await cookies();
  const session = readEtsySession(jar.get(ETSY_COOKIE)?.value);
  if (!session) redirect(`/${locale}/etsy`);
  const row = await getEtsyCode(session.code);
  if (!row || row.status === "revoked") redirect(`/${locale}/etsy`);
  if (row.kind !== "davetiye") redirect(`/${locale}/etsy/tasarla`);
  if (isEtsyOpenChoice(row)) redirect(`/${locale}/etsy/sec`);

  return (
    <Wizard
      step={step as WizardStepId}
      sablon={row.productSlug}
      etsy={{ code: row.code, slug: row.productSlug, title: row.productTitle }}
    />
  );
}
