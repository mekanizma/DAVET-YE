import type { Metadata } from "next";
import EventLanding from "@/components/EventLanding";

export const metadata: Metadata = {
  title: "Düğün davetiyesi",
  description: "Nişan ve düğün için animasyonlu açılışlı, tek bağlantıyla paylaşılan dijital davetiyeler.",
};

export default function Page() {
  return (
    <EventLanding
      event="nisan-dugun"
      eyebrow="Nişan & Düğün"
      title="Düğün davetiyesi"
      lead="Zarf, kapı, perde ya da mühür açılışıyla telefonda açılan zarif düğün davetiyeleri. Konum, geri sayım, katılım formu ve dilek defteri tek bağlantıda."
      points={[
        { title: "Animasyonlu açılış", text: "Misafiriniz bağlantıya dokunduğunda davetiye zarf, kapı, perde ya da mühürle açılır." },
        { title: "Katılım takibi", text: "Katılım formundaki yanıtlar tek yerde birikir; kaç kişi geleceğini önceden bilirsiniz." },
        { title: "Konum ve takvim", text: "Tek dokunuşla yol tarifi ve takvime ekleme; misafirleriniz yolunu şaşırmaz." },
      ]}
    />
  );
}
