import Link from "next/link";
import Logo from "@/components/Logo";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";

export default async function NotFound() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <main id="main" className="notfound">
      <Logo width={140} />
      <p className="eyebrow">404</p>
      <h1>{en ? "Page not found" : "Aradığınız sayfa bulunamadı"}</h1>
      <p>{en ? "The address may have changed or been mistyped." : "Adres değişmiş ya da yanlış yazılmış olabilir."}</p>
      <div className="notfound__cta">
        <Link href={lp(locale)} className="btn btn--dark btn--lg">{en ? "Back to the home page" : "Ana sayfaya dön"}</Link>
        <Link href={lp(locale, "/temalar")} className="btn btn--outline btn--lg">{en ? "Browse invitations" : "Davetiyelere göz at"}</Link>
      </div>
    </main>
  );
}
