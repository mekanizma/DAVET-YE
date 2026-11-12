import type { Metadata } from "next";
import AuthForm from "@/components/panel/AuthForm";

export const metadata: Metadata = { title: "Giriş" };

export default function Page() {
  return <AuthForm mode="giris" />;
}
