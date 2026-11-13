import type { Metadata } from "next";
import AuthForm from "@/components/panel/AuthForm";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "Sign in" : "Giriş" };
}

export default function Page() {
  return <AuthForm mode="giris" />;
}
