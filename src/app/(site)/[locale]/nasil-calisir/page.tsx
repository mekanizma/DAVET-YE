import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ProductTabs from "@/components/ProductTabs";
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
    title: en ? "How it works" : "Nasıl çalışır",
    description: en
      ? "Prepare your digital invitation in minutes. You do not need any design experience, and you see every step in the live preview."
      : "Dijital davetiyenizi dakikalar içinde hazırlayın. Tasarım bilgisi gerekmez; her adımı canlı önizlemede görürsünüz.",
    path: lp(locale, "/nasil-calisir"),
  });
}

function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="steps">
      {items.map((s, i) => (
        <li key={s.title} className="step">
          <span className="step__no num">{i + 1}</span>
          <div>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Header({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <div className="page-title page-title--center">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{lead}</p>
    </div>
  );
}

export default async function HowPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const copy = marketing(locale);
  const eyebrow = en ? "How it works" : "Nasıl çalışır";
  const lead = en
    ? "You do not need any design experience. At every step you see what you are doing in the live preview."
    : "Tasarım bilgisi gerekmiyor. Her adımda ne yaptığınızı canlı önizlemede görürsünüz.";
  return (
    <section className="section section--tight">
      <div className="wrap wrap--sm">
        <ProductTabs
          label={en ? "Product" : "Ürün"}
          tabs={[
            {
              id: "davetiye",
              label: en ? "Invitation" : "Davetiye",
              header: <Header eyebrow={eyebrow} title={en ? "Your invitation is ready in six steps" : "Altı adımda davetiyeniz hazır"} lead={lead} />,
              panel: (
                <>
                  <Steps items={copy.howInvitation} />
                  <div className="page-cta">
                    <p>
                      {en
                        ? "It is ready in minutes. Start creating your invitation now."
                        : "Dakikalar içinde hazır; davetiyenizi hemen oluşturmaya başlayın."}
                    </p>
                    <Link href={lp(locale, "/davetiye-olustur")} className="btn btn--dark btn--lg btn--serif">
                      {en ? "Start now" : "Hemen Başla"} <Icon name="arrow" size={16} />
                    </Link>
                  </div>
                </>
              ),
            },
            {
              id: "gazete",
              label: en ? "Newspaper" : "Gazete",
              header: <Header eyebrow={eyebrow} title={en ? "Your newspaper, ready step by step" : "Adım adım gazeteniz hazır"} lead={lead} />,
              panel: (
                <>
                  <Steps items={copy.howNewspaper} />
                  {en ? null : (
                    <p className="note-inferred">
                      Gazete adımları referansta açılmadı; ürün bilgisinden türetilmiştir.
                    </p>
                  )}
                  <div className="page-cta">
                    <p>{en ? "Put your story on the front page." : "Hikâyenizi manşete taşıyın."}</p>
                    <Link href={lp(locale, "/gazete-tasarla")} className="btn btn--dark btn--lg btn--serif">
                      {en ? "Create a newspaper" : "Gazete Oluştur"} <Icon name="arrow" size={16} />
                    </Link>
                  </div>
                </>
              ),
            },
          ]}
        />
      </div>
    </section>
  );
}
