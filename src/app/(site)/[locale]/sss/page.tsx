import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Accordion from "@/components/Accordion";
import JsonLd from "@/components/JsonLd";
import { isLocale, lp } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
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
    title: en ? "Frequently asked questions" : "Sık sorulan sorular",
    description: en
      ? "Questions about sharing a digital invitation, RSVPs, editing, payment, and how long it stays online."
      : "Dijital davetiye paylaşımı, katılım yanıtları, düzenleme, ödeme ve yayın süresi hakkında sorular.",
    path: lp(locale, "/sss"),
  });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const faq = marketing(locale).faq;
  return (
    <section className="section section--tight">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: en ? "en" : "tr-TR",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <div className="wrap wrap--sm">
        <div className="page-title page-title--center">
          <p className="eyebrow">{en ? "Frequently asked questions" : "Sıkça sorulan sorular"}</p>
          <h1>{en ? "Frequently asked questions" : "Sık sorulan sorular"}</h1>
          <p>
            {en
              ? "Sharing, RSVPs, editing, payment, and how long an invitation stays online."
              : "Paylaşım, katılım yanıtları, düzenleme, ödeme ve yayın süresi hakkında merak ettikleriniz."}
          </p>
        </div>
        <Accordion items={faq} />
        <p className="note-inferred">
          {en
            ? "Answers describe how the product works."
            : "Soru başlıkları referanstan alınmıştır; yanıt metinleri referansta kapalı grupta yakalanamadığı için bu yerel kopyada ürün bilgisinden türetilmiştir."}
        </p>
        <div className="page-cta">
          <h2>{en ? "Couldn’t find the answer you were looking for?" : "Aradığınız yanıtı bulamadınız mı?"}</h2>
          <p>{en ? "Write to us, and we will reply as soon as we can." : "Bize yazın; sorunuzu en kısa sürede yanıtlayalım."}</p>
          <Link href={lp(locale, "/iletisim")} className="btn btn--dark btn--lg btn--serif">
            {en ? "Write to us" : "Bize yazın"}
          </Link>
        </div>
      </div>
    </section>
  );
}
