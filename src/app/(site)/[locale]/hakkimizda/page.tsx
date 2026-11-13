import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentPage from "@/components/ContentPage";
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
    title: en ? "About" : "Hakkımızda",
    description: en
      ? "Davetanisi turns wedding, engagement, and henna-night invitations into experiences that open on a phone in Turkey."
      : "Davetanisi, düğün, nişan ve kına davetiyelerini Türkiye’de telefonda açılan deneyimlere dönüştürür.",
    path: lp(locale, "/hakkimizda"),
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  return (
    <ContentPage
      eyebrow={en ? "About" : "Hakkımızda"}
      title={en ? "We bring the invitation, the memory, and the story online" : "Davetiyeyi, anıyı, hikâyeyi dijitale taşıyoruz"}
      lead={
        en
          ? "Davetanisi turns invitations for a wedding, an engagement, or a henna night into experiences that open on a phone and are easy to share."
          : "Davetanisi; düğün, nişan ve kına davetiyelerini telefonda açılan, paylaşması kolay deneyimlere dönüştürür."
      }
    >
      <h2>{en ? "What we do" : "Ne yapıyoruz?"}</h2>
      <p>
        {en
          ? "You choose an invitation you like from the ready-made designs, enter your details, and send one link to your guests. RSVPs, wishes, and photographs gather in one place."
          : "Hazır tasarımlar arasından beğendiğiniz davetiyeyi seçer, bilgilerinizi girer ve tek bir bağlantıyla misafirlerinize gönderirsiniz. Katılım yanıtları, dilekler ve fotoğraflar tek yerde toplanır."}
      </p>
      <h2>{en ? "What we care about" : "Neye önem veriyoruz?"}</h2>
      <ul>
        {en ? (
          <>
            <li><strong>Clear pricing:</strong> A one-time payment, and add-ons are clearly marked.</li>
            <li><strong>Phone first:</strong> Most invitations are opened on a phone, so we try everything on a small screen first.</li>
            <li><strong>Accessibility:</strong> We respect the reduced-motion setting, and we take care that the site works with a keyboard and a screen reader.</li>
            <li><strong>Privacy:</strong> Only the invitation owner sees guest details.</li>
          </>
        ) : (
          <>
            <li><strong>Şeffaf fiyat:</strong> Tek seferlik ödeme; eklentiler açıkça işaretlenir.</li>
            <li><strong>Telefon önce:</strong> Davetiyelerin çoğu telefonda açılır; her şeyi önce küçük ekranda deneriz.</li>
            <li><strong>Erişilebilirlik:</strong> Hareket azaltma tercihine saygı duyar, klavye ve ekran okuyucuyla kullanıma özen gösteririz.</li>
            <li><strong>Gizlilik:</strong> Misafir bilgilerini yalnızca davetiye sahibi görür.</li>
          </>
        )}
      </ul>
      <p>
        {en ? (
          <>You can <Link href={lp(locale, "/iletisim")}>write to us</Link> with your ideas.</>
        ) : (
          <>Fikirleriniz için <Link href={lp(locale, "/iletisim")}>bize yazabilirsiniz</Link>.</>
        )}
      </p>
    </ContentPage>
  );
}
