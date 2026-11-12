import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import ProductTabs from "@/components/ProductTabs";
import { HOW_IT_WORKS_INVITATION, HOW_IT_WORKS_NEWSPAPER } from "@/data/site";

import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Nasıl çalışır",
  description: "Dijital davetiyenizi dakikalar içinde hazırlayın. Tasarım bilgisi gerekmez; her adımı canlı önizlemede görürsünüz.",
  path: "/tr/nasil-calisir",
});

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

function Header({ title }: { title: string }) {
  return (
    <div className="page-title page-title--center">
      <p className="eyebrow">Nasıl çalışır</p>
      <h1>{title}</h1>
      <p>Tasarım bilgisi gerekmiyor. Her adımda ne yaptığınızı canlı önizlemede görürsünüz.</p>
    </div>
  );
}

export default function HowPage() {
  return (
    <section className="section section--tight">
      <div className="wrap wrap--sm">
        <ProductTabs
          tabs={[
            {
              id: "davetiye",
              label: "Davetiye",
              header: <Header title="Altı adımda davetiyeniz hazır" />,
              panel: (
                <>
                  <Steps items={HOW_IT_WORKS_INVITATION} />
                  <div className="page-cta">
                    <p>Dakikalar içinde hazır; davetiyenizi hemen oluşturmaya başlayın.</p>
                    <Link href="/tr/davetiye-olustur" className="btn btn--dark btn--lg btn--serif">
                      Hemen Başla <Icon name="arrow" size={16} />
                    </Link>
                  </div>
                </>
              ),
            },
            {
              id: "gazete",
              label: "Gazete",
              header: <Header title="Adım adım gazeteniz hazır" />,
              panel: (
                <>
                  <Steps items={HOW_IT_WORKS_NEWSPAPER} />
                  <p className="note-inferred">
                    Gazete adımları referansta açılmadı; ürün bilgisinden türetilmiştir.
                  </p>
                  <div className="page-cta">
                    <p>Hikâyenizi manşete taşıyın.</p>
                    <Link href="/tr/gazete-tasarla" className="btn btn--dark btn--lg btn--serif">
                      Gazete Oluştur <Icon name="arrow" size={16} />
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
