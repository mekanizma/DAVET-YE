import type { Metadata } from "next";
import { Suspense } from "react";
import Dashboard from "@/components/panel/Dashboard";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "My account" : "Panelim" };
}

export default async function Page() {
  const locale = await getLocale();
  return (
    <Suspense fallback={<p className="muted" role="status">{locale === "en" ? "Loading…" : "Yükleniyor…"}</p>}>
      <Dashboard />
    </Suspense>
  );
}
