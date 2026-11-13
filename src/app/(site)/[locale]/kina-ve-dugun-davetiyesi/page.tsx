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
    title: en ? "Henna and wedding invitation" : "Kına ve düğün davetiyesi",
    description: en
      ? "A digital invitation that brings a henna night, a nikah, and a wedding together on one link."
      : "Kına, nikâh ve düğünü tek bağlantıda birleştiren çok günlü dijital davetiyeler.",
    path: lp(locale, "/kina-ve-dugun-davetiyesi"),
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return (
    <EventLanding
      event="coklu"
      eyebrow={en ? "Henna and wedding" : "Çoklu Etkinlik"}
      title={en ? "Henna and wedding invitation" : "Kına ve düğün davetiyesi"}
      lead={
        en
          ? "Do not send a separate link for the henna night, the nikah, and the wedding. Bring several ceremonies into one invitation, each with its own date and place."
          : "Kına gecesi, nikâh ve düğün için ayrı ayrı bağlantı göndermeyin: birden fazla töreni tek davetiyede, her biri kendi tarih ve konumuyla birleştirin."
      }
      points={
        en
          ? [
              { title: "One link, several ceremonies", text: "Turn on the promise, engagement, henna, nikah, wedding, and after-party sections as you need them." },
              { title: "A calendar entry for each ceremony", text: "Guests can add each ceremony to their calendar separately." },
              { title: "One RSVP form", text: "They say which ceremonies they will attend, on a single form." },
            ]
          : [
              { title: "Tek bağlantı, çok tören", text: "Söz, nişan, kına, nikâh, düğün ve after parti bölümlerini ihtiyacınıza göre açın." },
              { title: "Her tören için takvim", text: "Misafirler her töreni ayrı ayrı takvimlerine ekleyebilir." },
              { title: "Tek katılım formu", text: "Hangi törene geleceklerini tek formda bildirsinler." },
            ]
      }
    />
  );
}
