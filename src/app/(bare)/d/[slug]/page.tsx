import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import ShareInvitation from "@/components/share/ShareInvitation";
import ShareNewspaper from "@/components/share/ShareNewspaper";
import type { Locale } from "@/i18n/locale";
import { sharePage } from "@/lib/shareLink";

function loadStage(slug: string, locale: Locale) {
  const english = path.join(process.cwd(), "src/data/stages/en", `${slug}.json`);
  const file = locale === "en" && fs.existsSync(english)
    ? english
    : path.join(process.cwd(), "src/data/stages", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await sharePage(slug);
  const en = found.state !== "missing" && found.state !== "live" ? found.locale === "en" : found.state === "live" && found.row.locale === "en";
  return {
    title: en ? "Your page" : "Sayfanız",
    robots: { index: false, follow: false },
  };
}

function Note({ locale, title, text }: { locale: Locale; title: string; text: string }) {
  return (
    <main className="share-note">
      <p className="share-note__brand">Davetanisi</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </main>
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await sharePage(slug);
  if (found.state === "missing") {
    return <Note locale="tr" title="Adres bulunamadı" text="Bu paylaşım adresi kayıtlı değil." />;
  }
  if (found.state === "pending") {
    const en = found.locale === "en";
    return (
      <Note
        locale={found.locale}
        title={en ? "This page is not open yet" : "Bu sayfa henüz açılmadı"}
        text={en ? "It opens when the payment is confirmed." : "Ödeme onaylanınca açılır."}
      />
    );
  }
  if (found.state === "expired") {
    const en = found.locale === "en";
    return (
      <Note
        locale={found.locale}
        title={en ? "This address has expired" : "Bu adresin süresi doldu"}
        text={en ? "The online term for this page has ended." : "Bu sayfanın online süresi bitti."}
      />
    );
  }

  const { row } = found;
  if (row.kind === "gazete") {
    return <ShareNewspaper template={row.template} locale={row.locale} design={row.payload} />;
  }
  return (
    <ShareInvitation
      template={row.template}
      locale={row.locale}
      stage={loadStage(row.template, row.locale)}
      design={row.payload}
    />
  );
}
