import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import EtsyLogin from "@/components/etsy/EtsyLogin";
import { isLocale } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: locale === "en" ? "Etsy newspaper access" : "Etsy gazete erişimi",
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ebe4d8",
  viewportFit: "cover",
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <EtsyLogin />;
}
