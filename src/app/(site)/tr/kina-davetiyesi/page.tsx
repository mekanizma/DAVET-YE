import type { Metadata } from "next";
import EventLanding from "@/components/EventLanding";

export const metadata: Metadata = {
  title: "Kına davetiyesi",
  description: "Kına gecesine özel, geleneksel motifli dijital davetiyeler.",
};

export default function Page() {
  return (
    <EventLanding
      event="kina"
      eyebrow="Kına"
      title="Kına davetiyesi"
      lead="Kına gecesinin sıcaklığını yansıtan, geleneksel motifli ve animasyonlu dijital davetiyeler. Program akışı, kıyafet kodu ve katılım formu dahil."
      points={[
        { title: "Geleneksel motifler", text: "Çini, kaftan ve saray esintili tasarımlarla kına gecesine uygun bir atmosfer." },
        { title: "Program ve kıyafet kodu", text: "Gecenin akışını ve kıyafet tercihinizi misafirlerinize önceden duyurun." },
        { title: "Anı Duvarı", text: "Gece boyunca çekilen fotoğraflar tek duvarda toplansın (isteğe bağlı eklenti)." },
      ]}
    />
  );
}
