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
    title: en ? "Privacy policy" : "Gizlilik politikası",
    description: en
      ? "Davetanisi privacy policy: how accounts, invitation content, and guest replies are handled."
      : "Davetanisi gizlilik politikası: hesap, davetiye içeriği ve misafir yanıtlarının nasıl işlendiği.",
    path: lp(locale, "/gizlilik"),
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale === "en") {
    return (
      <ContentPage eyebrow="Legal" title="Privacy policy">
        <h2>What we collect</h2>
        <p>Your account details, the invitation content, RSVPs sent by guests, wishes, and uploaded photographs.</p>
        <h2>How we store data</h2>
        <p>
          Account and order data are kept on secure servers so you can manage your invitation and payments.
          Drafts may also stay in your browser until you finish or clear them.
        </p>
        <h2>Sharing</h2>
        <p>Personal information is not sold to third parties. It is shared only as far as necessary with required providers, such as a payment provider.</p>
        <h2>Cookies</h2>
        <p>See the cookie policy for the details.</p>
      </ContentPage>
    );
  }
  return (
    <ContentPage eyebrow="Yasal" title="Gizlilik politikası">
      <h2>Topladığımız bilgiler</h2>
      <p>Hesap bilgileriniz, davetiye içeriği, misafirlerin ilettiği katılım yanıtları, dilekler ve yüklenen fotoğraflar.</p>
      <h2>Verilerin saklanması</h2>
      <p>
        Hesap ve sipariş bilgileri, davetiyenizi ve ödemelerinizi yönetebilmeniz için güvenli sunucularda tutulur.
        Taslaklar tamamlanana veya temizlenene kadar tarayıcınızda da kalabilir.
      </p>
      <h2>Paylaşım</h2>
      <p>Kişisel bilgiler üçüncü taraflara satılmaz. Ödeme sağlayıcısı gibi zorunlu hizmet sağlayıcılarla yalnızca gerekli ölçüde paylaşılır.</p>
      <h2>Çerezler</h2>
      <p>Ayrıntılar için çerez politikasına bakın.</p>
    </ContentPage>
  );
}
