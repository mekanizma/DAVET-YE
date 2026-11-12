import type { Metadata } from "next";
import Dashboard from "@/components/panel/Dashboard";

export const metadata: Metadata = { title: "Panelim" };

export default function Page() {
  return <Dashboard />;
}
