import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = { title: "KVKK aydınlatma metni" };

export default function Page() {
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
