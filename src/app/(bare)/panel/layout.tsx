import type { Metadata } from "next";
import PanelFrame from "@/components/panel/PanelFrame";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel · Davetanisi" }, robots: { index: false, follow: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelFrame>{children}</PanelFrame>;
}
