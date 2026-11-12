import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const s = typeof sp.sablon === "string" ? sp.sablon : "";
  redirect(`/tr/davetiye-olustur/${s ? "sablon" : "etkinlik"}${s ? `?sablon=${encodeURIComponent(s)}` : ""}`);
}
