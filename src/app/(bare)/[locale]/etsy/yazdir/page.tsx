import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import EtsyPrint from "@/components/etsy/EtsyPrint";
import { isLocale } from "@/i18n/locale";
import { ETSY_COOKIE, readEtsySession } from "@/lib/etsySession";
import { getEtsyCode } from "@/lib/etsyStore";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: locale === "en" ? "Print newspaper" : "Gazete yazdır",
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
  const jar = await cookies();
  const session = readEtsySession(jar.get(ETSY_COOKIE)?.value);
  if (!session) redirect(`/${locale}/etsy`);
  const row = await getEtsyCode(session.code);
  if (!row || row.status === "revoked") redirect(`/${locale}/etsy`);
  return <EtsyPrint slug={row.newspaperSlug} />;
}
