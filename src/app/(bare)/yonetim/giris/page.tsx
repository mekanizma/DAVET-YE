import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Giriş" };

export default function Page() {
  return (
    <div className="adm-login">
      <Suspense fallback={<p role="status">Yükleniyor…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
