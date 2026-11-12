import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import ProductTabs from "@/components/ProductTabs";
import { NEWSPAPER_FEATURES } from "@/data/site";
import { OFFER_INVITATION } from "@/data/sections";

import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Ne sunuyoruz",
  description: "Dijital davetiye ve düğün gazetesinde neler olabilir? Katılım, konum, geri sayım ve anı duvarı gibi bölümleri siz seçersiniz.",
  path: "/tr/ne-sunuyoruz",
});

const HEADINGS: Record<string, { title: string; lead: string }> = {
  davetiye: {
    title: "Davetiyenizde neler olabilir?",
    lead: "İsteğe bağlı bölümleri açıp kapatırsınız. Ücretli eklentiler açıkça işaretlidir.",
  },
  gazete: {
    title: "Gazetenizde neler olabilir?",
    lead: "Hikâyenizi manşete taşıyan sayfa çevirmeli gazete; baskıya da hazır.",
  },
};

const PILLS = [
  { t: "Esnek", d: "İstediğiniz bölümleri açın ya da kapatın" },
  { t: "Canlı önizleme", d: "Her değişikliği anında görün" },
  { t: "Tek seferlik ödeme", d: "Abonelik yok, fiyat özeti önünüzde" },
];

function Header({ id }: { id: "davetiye" | "gazete" }) {
  return (
    <div className="page-title page-title--center">
      <p className="eyebrow">Size ne sunuyoruz</p>
      <h1>{HEADINGS[id].title}</h1>
      <p>{HEADINGS[id].lead}</p>
      <ul className="pills">
        {PILLS.map((p) => (
          <li key={p.t}>
            <strong>{p.t}</strong>
            <span>{p.d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OfferPage() {
  return (
    <section className="section section--tight">
      <div className="wrap">
        <ProductTabs
          label="Ürün"
          tabs={[
            {
              id: "davetiye",
              label: "Davetiye",
              header: <Header id="davetiye" />,
              panel: (
                <>
                  <ul className="offer-grid">
                    {OFFER_INVITATION.map((f) => (
                      <li key={f.title} className="offer-card">
                        {"addon" in f && f.addon && <span className="tag-addon offer-card__tag">EKLENTİ</span>}
                        <span className="offer-card__icon"><Icon name="check" size={16} /></span>
                        <h2>{f.title}</h2>
                        <p>{f.text}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="page-cta">
                    <p>Davetiyenizi size uygun bölümlerle oluşturun.</p>
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
              header: <Header id="gazete" />,
              panel: (
                <>
                  <ul className="offer-grid">
                    {NEWSPAPER_FEATURES.map((f) => (
                      <li key={f.title} className="offer-card">
                        <span className="offer-card__icon"><Icon name="check" size={16} /></span>
                        <h2>{f.title}</h2>
                        <p>{f.text}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="note-inferred">
                    Gazete sekmesindeki özellik metinleri referansta açılmadı; ürün bilgisinden türetilmiştir.
                  </p>
                  <div className="page-cta">
                    <p>Gazetenizi hemen hazırlayın.</p>
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
