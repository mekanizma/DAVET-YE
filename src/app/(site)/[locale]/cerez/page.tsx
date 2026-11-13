import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConsentButton from "@/components/ConsentButton";
import ContentPage from "@/components/ContentPage";
import { isLocale, lp } from "@/i18n/locale";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return pageMeta({
    title: en ? "Cookie policy" : "Çerez politikası",
    description: en ? "Davetanisi policy on cookies and browser storage." : "Davetanisi çerez ve tarayıcı depolama politikası.",
    path: lp(locale, "/cerez"),
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale === "en") {
    return (
      <ContentPage eyebrow="Legal" title="Cookie policy" draft>
        <h2>Essential storage</h2>
        <p>Browser storage is used to keep your session, your drafts, and your preferences.</p>
        <h2>Optional</h2>
        <p>This local copy does not use cookies for analytics or advertising.</p>
        <h2>Your choice</h2>
        <p>You can change your cookie-notice preference again below.</p>
        <ConsentButton />
      </ContentPage>
    );
  }
  return (
    <ContentPage eyebrow="Yasal" title="Çerez politikası" draft>
      <h2>Zorunlu depolama</h2>
      <p>Oturumunuzu, taslaklarınızı ve tercihlerinizi tutmak için tarayıcı depolaması kullanılır.</p>
      <h2>İsteğe bağlı</h2>
      <p>Bu yerel kopyada analiz ya da reklam amaçlı çerez kullanılmaz.</p>
      <h2>Tercihiniz</h2>
      <p>Çerez bildirimi tercihinizi aşağıdan yeniden değiştirebilirsiniz.</p>
      <ConsentButton />
    </ContentPage>
  );
}
