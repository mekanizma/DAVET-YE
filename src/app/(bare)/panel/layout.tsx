import type { Metadata } from "next";
import { headers } from "next/headers";
import PanelFrame from "@/components/panel/PanelFrame";
import { loadPanelAccount } from "@/lib/panelAccount";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel · Davetanisi" }, robots: { index: false, follow: false } };

const OPEN = new Set(["/panel/giris", "/panel/kayit", "/panel/sifremi-unuttum", "/panel/sifre-yenile"]);

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-pathname") || "";
  const initialAccount = OPEN.has(path) ? null : await loadPanelAccount();
  return <PanelFrame initialAccount={initialAccount}>{children}</PanelFrame>;
}
