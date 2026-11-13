import type { Metadata } from "next";
import Dashboard from "@/components/panel/Dashboard";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "My account" : "Panelim" };
}

export default function Page() {
  return <Dashboard />;
}
