import { notFound, redirect } from "next/navigation";
import { isLocale, lp } from "@/i18n/locale";

function queryOf(sp: Record<string, string | string[] | undefined>) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") q.append(key, value);
    else if (Array.isArray(value)) for (const item of value) q.append(key, item);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

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
  redirect(`${lp(locale, "/gazete-tasarla")}${queryOf(sp)}`);
}
