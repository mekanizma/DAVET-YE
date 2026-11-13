import type { Metadata } from "next";
import dynamic from "next/dynamic";
import DraftCard from "@/components/panel/DraftCard";
import { getLocale } from "@/i18n/server";

const PreparedCards = dynamic(() => import("@/components/panel/PreparedCards"));

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "My designs" : "Tasarımlarım" };
}

export default async function Page() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <p className="eyebrow">{en ? "My designs" : "Tasarımlarım"}</p>
          <h1>{en ? "Your invitations" : "Davetiyeleriniz"}</h1>
          <p className="muted">{en ? "Confirmed orders stay on your account. QR cards and one-page invitations can be opened and downloaded here." : "Onaylanan siparişler hesabınızda durur. QR kartı ve tek sayfalık davetiye buradan açılır ve indirilir."}</p>
        </div>
      </header>
      <PreparedCards />
      <DraftCard />
    </div>
  );
}
