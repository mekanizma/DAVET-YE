import type { Metadata } from "next";
import AuthForm from "@/components/panel/AuthForm";

export const metadata: Metadata = { title: "Şifremi unuttum" };

export default function Page() {
  return <AuthForm mode="sifre" />;
}
