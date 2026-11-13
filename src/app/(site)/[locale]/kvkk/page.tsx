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
    title: en ? "Personal data notice" : "KVKK aydınlatma metni",
    description: en
      ? "Davetanisi personal data notice under Turkish Law No. 6698 (KVKK), and the purposes for which personal data is processed."
      : "Davetanisi KVKK aydınlatma metni ve kişisel verilerin işlenme amaçları.",
    path: lp(locale, "/kvkk"),
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale === "en") {
    return (
      <ContentPage
        eyebrow="Legal"
        title="Personal data notice"
        lead="This is the notice under Turkish Law No. 6698 on the Protection of Personal Data (KVKK)."
        draft
      >
        <h2>Data controller</h2>
        <p>The data controller’s details, under Turkish Law No. 6698 on the Protection of Personal Data (KVKK), appear here on the live site.</p>
        <h2>Purpose of processing</h2>
        <p>Managing your account, publishing the invitation, passing on RSVPs, and carrying out payment.</p>
        <h2>Your rights</h2>
        <ul>
          <li>Learning whether your personal data is processed</li>
          <li>Requesting information if it is</li>
          <li>Asking for it to be corrected, erased, or destroyed</li>
          <li>Claiming compensation if you suffer a loss</li>
        </ul>
        <p>To apply, use the address on the contact page.</p>
      </ContentPage>
    );
  }
  return (
    <ContentPage eyebrow="Yasal" title="KVKK aydınlatma metni" draft>
      <h2>Veri sorumlusu</h2>
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu bilgileri gerçek yayında burada yer alır.</p>
      <h2>İşleme amacı</h2>
      <p>Hesabınızın yönetimi, davetiyenin yayınlanması, katılım yanıtlarının iletilmesi ve ödeme işlemlerinin yürütülmesi.</p>
      <h2>Haklarınız</h2>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>İşlenmişse bilgi talep etme</li>
        <li>Düzeltme, silme ya da yok edilmesini isteme</li>
        <li>Zarara uğramanız hâlinde tazminat talep etme</li>
      </ul>
      <p>Başvurular için iletişim sayfasındaki adresi kullanabilirsiniz.</p>
    </ContentPage>
  );
}
