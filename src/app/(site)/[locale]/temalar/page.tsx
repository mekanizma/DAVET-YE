import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ThemeCatalog, { type CatalogInitial } from "@/components/ThemeCatalog";
import { EVENT_LABELS, type EventType } from "@/data/themes";
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
    title: en ? "Digital invitations" : "Dijital davetiyeler",
    description: en
      ? "Invitations designed for a phone, for a wedding, an engagement, or a henna night. Preview full screen before you buy, and share one link."
      : "Düğün, nişan ve kına için telefon ekranına göre hazırlanmış davetiyeler. Satın almadan tam ekran önizleyin, tek bağlantıyla paylaşın.",
    path: lp(locale, "/temalar"),
  });
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ThemesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const sp = await searchParams;
  const etk = one(sp.etkinlik);
  const sirala = one(sp.sirala);
  const initial: CatalogInitial = {
    q: one(sp.q),
    etkinlik: etk in EVENT_LABELS ? (etk as EventType) : "",
    etiket: one(sp.etiket),
    sirala: sirala === "fiyat" || sirala === "populer" ? sirala : "onerilen",
  };
  return (
    <>
      <section className="page-hero page-hero--catalog">
        <Image src="/img/decor/bouquet-tr.webp" alt="" width={420} height={520} className="page-hero__decor" aria-hidden="true" priority />
        <div className="wrap wrap--lg page-hero__inner">
          <p className="eyebrow">{en ? "Collection" : "Koleksiyon"}</p>
          <h1 className="page-hero__title">{en ? "An invitation for every event" : "Her etkinlik için bir davetiye"}</h1>
          <p className="page-hero__lead">
            {en
              ? "Every invitation is designed for a phone, and every one is shared with a single link. You can preview the one you choose, full screen, before you buy."
              : "Hepsi telefon için tasarlandı, hepsi tek bağlantıyla paylaşılır. Seçtiğiniz davetiyeyi satın almadan tam ekran önizleyebilirsiniz."}
          </p>
          <p className="page-hero__script" aria-hidden="true">
            {en ? "Special moments mean more with a special invitation…" : "Özel anlar, özel davetiyelerle daha anlamlı…"}
          </p>
        </div>
      </section>
      <section className="section section--tight catalog-section">
        <div className="wrap wrap--lg">
          <ThemeCatalog initial={initial} />
        </div>
      </section>
    </>
  );
}
