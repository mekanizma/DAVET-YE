import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = { title: "Hakkımızda" };

export default function Page() {
  return (
    <ContentPage
      eyebrow="Hakkımızda"
      title="Davetiyeyi, anıyı, hikâyeyi dijitale taşıyoruz"
      lead="Davetanisi; düğün, nişan ve kına davetiyelerini telefonda açılan, paylaşması kolay deneyimlere dönüştürür."
    >
      <h2>Ne yapıyoruz?</h2>
      <p>
        Hazır tasarımlar arasından beğendiğiniz davetiyeyi seçer, bilgilerinizi girer ve tek bir bağlantıyla
        misafirlerinize gönderirsiniz. Katılım yanıtları, dilekler ve fotoğraflar tek yerde toplanır.
      </p>
      <h2>Neye önem veriyoruz?</h2>
      <ul>
        <li><strong>Şeffaf fiyat:</strong> Tek seferlik ödeme; eklentiler açıkça işaretlenir.</li>
        <li><strong>Telefon önce:</strong> Davetiyelerin çoğu telefonda açılır; her şeyi önce küçük ekranda deneriz.</li>
        <li><strong>Erişilebilirlik:</strong> Hareket azaltma tercihine saygı duyar, klavye ve ekran okuyucuyla kullanıma özen gösteririz.</li>
        <li><strong>Gizlilik:</strong> Misafir bilgilerini yalnızca davetiye sahibi görür.</li>
      </ul>
      <p>
        Fikirleriniz için <Link href="/tr/iletisim">bize yazabilirsiniz</Link>.
      </p>
    </ContentPage>
  );
}
