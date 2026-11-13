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
    title: en ? "Wedding invitation" : "Düğün davetiyesi",
    description: en
      ? "Animated digital invitations for an engagement or a wedding, shared with one link. They open on a phone across Turkey."
      : "Nişan ve düğün için animasyonlu açılışlı, tek bağlantıyla paylaşılan dijital davetiyeler. Türkiye genelinde telefonda açılır.",
    path: lp(locale, "/dugun-davetiyesi"),
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return (
    <EventLanding
      event="nisan-dugun"
      eyebrow={en ? "Engagement and wedding" : "Nişan & Düğün"}
      title={en ? "Wedding invitation" : "Düğün davetiyesi"}
      lead={
        en
          ? "Elegant wedding invitations that open on a phone with an envelope, a door, a curtain, or a seal. Location, a countdown, an RSVP form, and a book of wishes, all on one link."
          : "Zarf, kapı, perde ya da mühür açılışıyla telefonda açılan zarif düğün davetiyeleri. Konum, geri sayım, katılım formu ve dilek defteri tek bağlantıda."
      }
      points={
        en
          ? [
              { title: "Animated opening", text: "When your guest taps the link, the invitation opens with an envelope, a door, a curtain, or a seal." },
              { title: "RSVP tracking", text: "Replies from the RSVP form gather in one place, so you know in advance how many people are coming." },
              { title: "Location and calendar", text: "Directions and add-to-calendar in one tap, so your guests do not lose their way." },
            ]
          : [
              { title: "Animasyonlu açılış", text: "Misafiriniz bağlantıya dokunduğunda davetiye zarf, kapı, perde ya da mühürle açılır." },
              { title: "Katılım takibi", text: "Katılım formundaki yanıtlar tek yerde birikir; kaç kişi geleceğini önceden bilirsiniz." },
              { title: "Konum ve takvim", text: "Tek dokunuşla yol tarifi ve takvime ekleme; misafirleriniz yolunu şaşırmaz." },
            ]
      }
    />
  );
}
