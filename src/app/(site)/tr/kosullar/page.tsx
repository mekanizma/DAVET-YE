import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Kullanım koşulları",
  description: "Davetanisi dijital davetiye ve gazete hizmetinin kullanım koşulları.",
  path: "/tr/kosullar",
  index: false,
});

export default function Page() {
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
