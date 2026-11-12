import type { Metadata } from "next";
import ResetPasswordForm from "@/components/panel/ResetPasswordForm";

export const metadata: Metadata = { title: "Yeni şifre" };

export default function Page() {
  return <ResetPasswordForm />;
}
