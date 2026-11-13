import type { Metadata } from "next";
import ResetPasswordForm from "@/components/panel/ResetPasswordForm";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "New password" : "Yeni şifre" };
}

export default function Page() {
  return <ResetPasswordForm />;
}
