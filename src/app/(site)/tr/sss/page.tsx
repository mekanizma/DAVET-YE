import type { Metadata } from "next";
import Link from "next/link";
import Accordion from "@/components/Accordion";
import JsonLd from "@/components/JsonLd";
import { FAQ } from "@/data/faq";

import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Sık sorulan sorular",
  description: "Dijital davetiye paylaşımı, katılım yanıtları, düzenleme, ödeme ve yayın süresi hakkında sorular.",
  path: "/tr/sss",
});

export default function FaqPage() {
  return (
    <section className="section section--tight">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: "tr-TR",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <div className="wrap wrap--sm">
        <div className="page-title page-title--center">
          <p className="eyebrow">Sıkça sorulan sorular</p>
          <h1>Sık sorulan sorular</h1>
          <p>Paylaşım, katılım yanıtları, düzenleme, ödeme ve yayın süresi hakkında merak ettikleriniz.</p>
        </div>
        <Accordion items={FAQ} />
        <p className="note-inferred">
          Soru başlıkları referanstan alınmıştır; yanıt metinleri referansta kapalı grupta yakalanamadığı için
          bu yerel kopyada ürün bilgisinden türetilmiştir.
        </p>
        <div className="page-cta">
          <h2>Aradığınız yanıtı bulamadınız mı?</h2>
          <p>Bize yazın; sorunuzu en kısa sürede yanıtlayalım.</p>
          <Link href="/tr/iletisim" className="btn btn--dark btn--lg btn--serif">
            Bize yazın
          </Link>
        </div>
      </div>
    </section>
  );
}
