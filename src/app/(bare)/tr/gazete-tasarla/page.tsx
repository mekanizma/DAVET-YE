import type { Metadata, Viewport } from "next";
import NewspaperStudio from "@/components/newspaper/NewspaperStudio";

export const metadata: Metadata = {
  title: "Gazete tasarla",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ebe4d8",
  viewportFit: "cover",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sablon = typeof sp.sablon === "string" ? sp.sablon : undefined;
  return <NewspaperStudio initialTemplate={sablon} />;
}
