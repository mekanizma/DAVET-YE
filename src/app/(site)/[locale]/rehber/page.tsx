import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentPage from "@/components/ContentPage";
import { isLocale, lp, type Locale } from "@/i18n/locale";
import { pageMeta } from "@/lib/seo";

const GUIDES: Record<Locale, { id: string; title: string; body: string[] }[]> = {
  tr: [
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
  ],
  en: [
    {
      id: "metin",
      title: "How to write the text",
      body: [
        "Keep it short and warm: who is inviting, when, and where should be in the first two sentences.",
        "If you want to include family names, settle the order first, and write both families with the same care.",
        "Put details such as dress and a policy on children in their own sections, not in the main text.",
      ],
    },
    {
      id: "zamanlama",
      title: "When to send",
      body: [
        "Send the digital invitation 4–6 weeks before the event, and earlier for guests travelling from another city.",
        "Set a deadline for RSVPs, and send a reminder a week before that date.",
      ],
    },
    {
      id: "katilim",
      title: "Tracking RSVPs",
      body: [
        "Keep the questions on the RSVP form short: how many people are coming, a menu preference, and a note are enough.",
        "Replies are listed in your account. Plan the seating once the replies are in.",
      ],
    },
    {
      id: "coklu",
      title: "Combining henna and wedding",
      body: [
        "Add each ceremony with its own date and place, so guests can see which ones they are invited to.",
        "On an invitation with more than one event, a single RSVP form asks which ceremonies they will attend.",
      ],
    },
    {
      id: "anilar",
      title: "Collecting photos",
      body: [
        "The Memory Wall gathers, on one wall, the photographs guests upload on the day.",
        "A table QR card lets a guest at the table upload a photograph with a single scan.",
      ],
    },
    {
      id: "gazete",
      title: "A newspaper as a keepsake",
      body: [
        "For the cover photograph, choose a tall, high-resolution frame.",
        "For print, choose A3 or A2. You can then print the pages yourself or send them to a printer.",
      ],
    },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return pageMeta({
    title: en ? "Digital invitation guide" : "Dijital davetiye rehberi",
    description: en
      ? "Short guides that help while you prepare a wedding or henna-night invitation."
      : "Düğün ve kına davetiyesi hazırlarken işinize yarayacak kısa rehberler.",
    path: lp(locale, "/rehber"),
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const guides = GUIDES[locale];
  return (
    <ContentPage
      eyebrow={en ? "Guide" : "Rehber"}
      title={en ? "Short guides" : "Kısa rehberler"}
      lead={en ? "Practical advice for preparing a digital invitation." : "Dijital davetiye hazırlarken işinize yarayacak pratik öneriler."}
    >
      <nav aria-label={en ? "On this page" : "Rehber içindekiler"} className="toc">
        <ul>
          {guides.map((g) => (
            <li key={g.id}>
              <a href={`#${g.id}`}>{g.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      {guides.map((g) => (
        <article key={g.id} id={g.id} className="guide">
          <h2>{g.title}</h2>
          {g.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </article>
      ))}
      <p>
        {en ? (
          <>When you are ready, <Link href={lp(locale, "/davetiye-olustur")}>start creating your invitation</Link>.</>
        ) : (
          <>Hazırsanız <Link href={lp(locale, "/davetiye-olustur")}>davetiyenizi oluşturmaya başlayın</Link>.</>
        )}
      </p>
    </ContentPage>
  );
}
