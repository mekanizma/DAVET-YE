import type { Metadata } from "next";
import DraftCard from "@/components/panel/DraftCard";
import { getLocale } from "@/i18n/server";

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
          <p className="muted">{en ? "Confirmed orders stay on your account. An unfinished design appears on this device as a draft." : "Onaylanan siparişler hesabınızda durur. Yarım kalan tasarım bu cihazda taslak olarak görünür."}</p>
        </div>
      </header>
      <DraftCard />
    </div>
  );
}
