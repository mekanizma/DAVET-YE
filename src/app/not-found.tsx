import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main id="main" className="notfound">
      <Logo width={140} />
      <p className="eyebrow">404</p>
      <h1>Aradığınız sayfa bulunamadı</h1>
      <p>Adres değişmiş ya da yanlış yazılmış olabilir.</p>
      <div className="notfound__cta">
        <Link href="/tr" className="btn btn--dark btn--lg">Ana sayfaya dön</Link>
        <Link href="/tr/temalar" className="btn btn--outline btn--lg">Davetiyelere göz at</Link>
      </div>
    </main>
  );
}
