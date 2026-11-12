import type { Metadata } from "next";
import EventLanding from "@/components/EventLanding";

export const metadata: Metadata = {
  title: "Kına ve düğün davetiyesi",
  description: "Kına, nikâh ve düğünü tek bağlantıda birleştiren çoklu etkinlik davetiyeleri.",
};

export default function Page() {
  return (
    <EventLanding
      event="coklu"
      eyebrow="Çoklu Etkinlik"
      title="Kına ve düğün davetiyesi"
      lead="Kına gecesi, nikâh ve düğün için ayrı ayrı bağlantı göndermeyin: birden fazla töreni tek davetiyede, her biri kendi tarih ve konumuyla birleştirin."
      points={[
        { title: "Tek bağlantı, çok tören", text: "Söz, nişan, kına, nikâh, düğün ve after parti bölümlerini ihtiyacınıza göre açın." },
        { title: "Her tören için takvim", text: "Misafirler her töreni ayrı ayrı takvimlerine ekleyebilir." },
        { title: "Tek katılım formu", text: "Hangi törene geleceklerini tek formda bildirsinler." },
      ]}
    />
  );
}
