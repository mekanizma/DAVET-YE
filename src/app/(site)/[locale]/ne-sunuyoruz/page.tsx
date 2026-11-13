import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ProductTabs from "@/components/ProductTabs";
import { isLocale, lp } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { offerInvitation } from "@/i18n/product";
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
    title: en ? "What we offer" : "Ne sunuyoruz",
    description: en
      ? "What can a digital invitation or a wedding newspaper include? You choose sections such as RSVP, location, a countdown, and a Memory Wall."
      : "Dijital davetiye ve düğün gazetesinde neler olabilir? Katılım, konum, geri sayım ve anı duvarı gibi bölümleri siz seçersiniz.",
    path: lp(locale, "/ne-sunuyoruz"),
  });
}

export default async function OfferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const copy = marketing(locale);
  const headings = en
    ? {
        davetiye: {
          title: "What can your invitation include?",
          lead: "Turn optional sections on or off. Paid add-ons are clearly marked.",
        },
        gazete: {
          title: "What can your newspaper include?",
          lead: "A page-turning newspaper that puts your story on the front page, and is ready to print.",
        },
      }
    : {
        davetiye: {
          title: "Davetiyenizde neler olabilir?",
          lead: "İsteğe bağlı bölümleri açıp kapatırsınız. Ücretli eklentiler açıkça işaretlidir.",
        },
        gazete: {
          title: "Gazetenizde neler olabilir?",
          lead: "Hikâyenizi manşete taşıyan sayfa çevirmeli gazete; baskıya da hazır.",
        },
      };
  const pills = en
    ? [
        { t: "Flexible", d: "Turn the sections you want on or off" },
        { t: "Live preview", d: "See every change at once" },
        { t: "One-time payment", d: "No subscription, and the price is in front of you" },
      ]
    : [
        { t: "Esnek", d: "İstediğiniz bölümleri açın ya da kapatın" },
        { t: "Canlı önizleme", d: "Her değişikliği anında görün" },
        { t: "Tek seferlik ödeme", d: "Abonelik yok, fiyat özeti önünüzde" },
      ];

  function Header({ id }: { id: "davetiye" | "gazete" }) {
    return (
      <div className="page-title page-title--center">
        <p className="eyebrow">{en ? "What we offer" : "Size ne sunuyoruz"}</p>
        <h1>{headings[id].title}</h1>
        <p>{headings[id].lead}</p>
        <ul className="pills">
          {pills.map((p) => (
            <li key={p.t}>
              <strong>{p.t}</strong>
              <span>{p.d}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="section section--tight">
      <div className="wrap">
        <ProductTabs
          label={en ? "Product" : "Ürün"}
          tabs={[
            {
              id: "davetiye",
              label: en ? "Invitation" : "Davetiye",
              header: <Header id="davetiye" />,
              panel: (
                <>
                  <ul className="offer-grid">
                    {offerInvitation(locale).map((f) => (
                      <li key={f.title} className="offer-card">
                        {"addon" in f && f.addon && <span className="tag-addon offer-card__tag">{copy.addonTag}</span>}
                        <span className="offer-card__icon"><Icon name="check" size={16} /></span>
                        <h2>{f.title}</h2>
                        <p>{f.text}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="page-cta">
                    <p>{en ? "Build your invitation with the sections that suit you." : "Davetiyenizi size uygun bölümlerle oluşturun."}</p>
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
              header: <Header id="gazete" />,
              panel: (
                <>
                  <ul className="offer-grid">
                    {copy.newspaperFeatures.map((f) => (
                      <li key={f.title} className="offer-card">
                        <span className="offer-card__icon"><Icon name="check" size={16} /></span>
                        <h2>{f.title}</h2>
                        <p>{f.text}</p>
                      </li>
                    ))}
                  </ul>
                  {en ? null : (
                    <p className="note-inferred">
                      Gazete sekmesindeki özellik metinleri referansta açılmadı; ürün bilgisinden türetilmiştir.
                    </p>
                  )}
                  <div className="page-cta">
                    <p>{en ? "Prepare your newspaper now." : "Gazetenizi hemen hazırlayın."}</p>
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
