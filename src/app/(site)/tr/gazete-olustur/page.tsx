import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sablon = typeof sp.sablon === "string" ? sp.sablon : "";
  redirect(`/tr/gazete-tasarla${sablon ? `?sablon=${encodeURIComponent(sablon)}` : ""}`);
}
