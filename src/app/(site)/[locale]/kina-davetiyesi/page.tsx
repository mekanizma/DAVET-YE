import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventLanding from "@/components/EventLanding";
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
    title: en ? "Henna-night invitation" : "Kına davetiyesi",
    description: en
      ? "Digital invitations with traditional motifs, made for a henna night. Share one link and follow RSVPs from your phone."
      : "Kına gecesine özel, geleneksel motifli dijital davetiyeler. Tek bağlantıyla paylaşın, katılımı telefondan izleyin.",
    path: lp(locale, "/kina-davetiyesi"),
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return (
    <EventLanding
      event="kina"
      eyebrow={en ? "Henna night" : "Kına"}
      title={en ? "Henna-night invitation" : "Kına davetiyesi"}
      lead={
        en
          ? "Animated digital invitations with traditional motifs, reflecting the warmth of a henna night. The order of the evening, a dress code, and an RSVP form are included."
          : "Kına gecesinin sıcaklığını yansıtan, geleneksel motifli ve animasyonlu dijital davetiyeler. Program akışı, kıyafet kodu ve katılım formu dahil."
      }
      points={
        en
          ? [
              { title: "Traditional motifs", text: "An atmosphere that suits a henna night, with tile, kaftan, and palace-inspired designs." },
              { title: "Programme and dress code", text: "Tell your guests the flow of the night, and what you would like them to wear." },
              { title: "Memory Wall", text: "Photographs taken through the night gather on one wall (an optional add-on)." },
            ]
          : [
              { title: "Geleneksel motifler", text: "Çini, kaftan ve saray esintili tasarımlarla kına gecesine uygun bir atmosfer." },
              { title: "Program ve kıyafet kodu", text: "Gecenin akışını ve kıyafet tercihinizi misafirlerinize önceden duyurun." },
              { title: "Anı Duvarı", text: "Gece boyunca çekilen fotoğraflar tek duvarda toplansın (isteğe bağlı eklenti)." },
            ]
      }
    />
  );
}
