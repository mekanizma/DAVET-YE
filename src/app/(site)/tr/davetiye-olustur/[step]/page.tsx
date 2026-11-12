import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Wizard from "@/components/wizard/Wizard";
import { WIZARD_STEPS, type WizardStepId } from "@/lib/wizardSteps";

export function generateStaticParams() {
  return WIZARD_STEPS.map((s) => ({ step: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ step: string }> }): Promise<Metadata> {
  const { step } = await params;
  const s = WIZARD_STEPS.find((x) => x.id === step);
  return { title: s ? `Davetiye oluştur · ${s.title}` : "Davetiye oluştur", robots: { index: false } };
}

export default async function WizardStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { step } = await params;
  const sp = await searchParams;
  if (!WIZARD_STEPS.some((s) => s.id === step)) notFound();
  const sablon = typeof sp.sablon === "string" ? sp.sablon : undefined;
  return <Wizard step={step as WizardStepId} sablon={sablon} />;
}
