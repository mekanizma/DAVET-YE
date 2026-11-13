import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import NewspaperStudio from "@/components/newspaper/NewspaperStudio";
import { isLocale } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: locale === "en" ? "Design a newspaper" : "Gazete tasarla",
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const sablon = typeof sp.sablon === "string" ? sp.sablon : undefined;
  return <NewspaperStudio initialTemplate={sablon} />;
}
