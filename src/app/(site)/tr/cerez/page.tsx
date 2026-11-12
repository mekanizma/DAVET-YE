import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";
import ConsentButton from "@/components/ConsentButton";

export const metadata: Metadata = { title: "Çerez politikası" };

export default function Page() {
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
