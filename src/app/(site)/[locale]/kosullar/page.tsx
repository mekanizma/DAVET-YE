import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    title: en ? "Terms of use" : "Kullanım koşulları",
    description: en
      ? "Terms of use for the Davetanisi digital invitation and newspaper service."
      : "Davetanisi dijital davetiye ve gazete hizmetinin kullanım koşulları.",
    path: lp(locale, "/kosullar"),
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale === "en") {
    return (
      <ContentPage eyebrow="Legal" title="Terms of use" draft>
        <h2>1. The service</h2>
        <p>The service lets you create, publish, and share a digital invitation and a newspaper from ready-made designs.</p>
        <h2>2. Account and content</h2>
        <p>You confirm that you hold the rights to the text and photographs you upload, and that they do not infringe anyone else’s rights.</p>
        <h2>3. Payment and time online</h2>
        <p>Fees are paid once. The invitation stays online for at least six months after the event date, and you can extend that with the Extra Time add-on.</p>
        <h2>4. Liability</h2>
        <p>We try to keep the service available without interruption. We are not liable for indirect loss arising from an interruption.</p>
        <h2>5. Changes</h2>
        <p>These terms may be updated. Important changes are announced on this page.</p>
      </ContentPage>
    );
  }
  return (
    <ContentPage eyebrow="Yasal" title="Kullanım koşulları" draft>
      <h2>1. Hizmet</h2>
      <p>Hizmet; hazır tasarımlarla dijital davetiye ve gazete oluşturma, yayınlama ve paylaşma imkânı sunar.</p>
      <h2>2. Hesap ve içerik</h2>
      <p>Yüklediğiniz metin ve fotoğrafların hak sahibi olduğunuzu ve üçüncü kişilerin haklarını ihlal etmediğini kabul edersiniz.</p>
      <h2>3. Ödeme ve yayın süresi</h2>
      <p>Ücretler tek seferliktir. Yayın süresi etkinlik tarihinden sonra en az 6 aydır; Ek Süre eklentisiyle uzatılabilir.</p>
      <h2>4. Sorumluluk</h2>
      <p>Hizmeti kesintisiz sunmaya çalışırız; ancak kesintilerden doğan dolaylı zararlardan sorumlu değiliz.</p>
      <h2>5. Değişiklikler</h2>
      <p>Koşullar güncellenebilir; önemli değişiklikler bu sayfada duyurulur.</p>
    </ContentPage>
  );
}
