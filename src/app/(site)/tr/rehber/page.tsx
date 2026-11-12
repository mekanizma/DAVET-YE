import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Rehber",
  description: "Dijital davetiye hazırlarken işinize yarayacak kısa rehberler.",
};

const GUIDES = [
  {
    id: "metin",
    title: "Davetiye metni nasıl yazılır?",
    body: [
      "Kısa ve sıcak tutun: kimin davet ettiği, ne zaman ve nerede olduğu ilk iki cümlede yer almalı.",
      "Aile adlarını yazmak isterseniz sıralamayı önceden netleştirin; her iki aileyi de aynı özenle yazın.",
      "Kıyafet ve çocuk politikası gibi ayrıntıları metne değil, ilgili bölüme koyun.",
    ],
  },
  {
    id: "zamanlama",
    title: "Ne zaman göndermeli?",
    body: [
      "Dijital davetiyeyi etkinlikten 4-6 hafta önce gönderin; uzak şehirden gelecek misafirler için daha erken.",
      "Katılım yanıtı için son tarih belirleyin ve bu tarihten bir hafta önce hatırlatma mesajı gönderin.",
    ],
  },
  {
    id: "katilim",
    title: "Katılım yanıtlarını takip etme",
    body: [
      "Katılım formundaki sorular kısa olsun: gelecek kişi sayısı, menü tercihi ve not yeterli.",
      "Yanıtlar panelde listelenir; masa planını yanıtlar tamamlandıktan sonra yapın.",
    ],
  },
  {
    id: "coklu",
    title: "Kına ve düğünü tek davetiyede birleştirme",
    body: [
      "Her töreni kendi tarih ve konumuyla ekleyin; misafirler hangisine davetli olduğunu görür.",
      "Çoklu etkinlik davetiyelerinde tek katılım formu hangi törene geleceklerini sorar.",
    ],
  },
  {
    id: "anilar",
    title: "Misafirlerden fotoğraf toplama",
    body: [
      "Anı Duvarı, misafirlerin etkinlik günü yüklediği fotoğrafları tek duvarda toplar.",
      "Masa QR kartı, masaya oturan misafirin tek taramayla fotoğraf yüklemesini sağlar.",
    ],
  },
  {
    id: "gazete",
    title: "Hatıra olarak gazete",
    body: [
      "Kapak fotoğrafı için dik ve yüksek çözünürlüklü bir kare seçin.",
      "Baskı için A3 ya da A2 boyutunu seçip sayfaları yazıcıdan alabilir ya da matbaaya gönderebilirsiniz.",
    ],
  },
];

export default function Page() {
  return (
    <ContentPage
      eyebrow="Rehber"
      title="Kısa rehberler"
      lead="Dijital davetiye hazırlarken işinize yarayacak pratik öneriler."
    >
      <nav aria-label="Rehber içindekiler" className="toc">
        <ul>
          {GUIDES.map((g) => (
            <li key={g.id}>
              <a href={`#${g.id}`}>{g.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      {GUIDES.map((g) => (
        <article key={g.id} id={g.id} className="guide">
          <h2>{g.title}</h2>
          {g.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </article>
      ))}
      <p>
        Hazırsanız <Link href="/tr/davetiye-olustur">davetiyenizi oluşturmaya başlayın</Link>.
      </p>
    </ContentPage>
  );
}
