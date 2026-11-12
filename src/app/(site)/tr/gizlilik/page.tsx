import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = { title: "Gizlilik politikası" };

export default function Page() {
  return (
    <ContentPage eyebrow="Yasal" title="Gizlilik politikası" draft>
      <h2>Topladığımız bilgiler</h2>
      <p>Hesap bilgileriniz, davetiye içeriği, misafirlerin ilettiği katılım yanıtları, dilekler ve yüklenen fotoğraflar.</p>
      <h2>Bu yerel kopyada</h2>
      <p>
        Bu yerel geliştirme kopyasında hiçbir veri sunucuya gönderilmez; taslaklar, giriş bilgileri ve yanıtlar
        yalnızca tarayıcınızın yerel depolamasında tutulur. Tarayıcı verilerini temizleyerek silebilirsiniz.
      </p>
      <h2>Paylaşım</h2>
      <p>Kişisel bilgiler üçüncü taraflara satılmaz. Ödeme sağlayıcısı gibi zorunlu hizmet sağlayıcılarla yalnızca gerekli ölçüde paylaşılır.</p>
      <h2>Çerezler</h2>
      <p>Ayrıntılar için çerez politikasına bakın.</p>
    </ContentPage>
  );
}
