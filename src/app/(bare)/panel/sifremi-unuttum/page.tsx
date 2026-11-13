import type { Metadata } from "next";
import AuthForm from "@/components/panel/AuthForm";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "Forgot password" : "Şifremi unuttum" };
}

export default function Page() {
  return <AuthForm mode="sifre" />;
}
