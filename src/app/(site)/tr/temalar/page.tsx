import type { Metadata } from "next";
import Image from "next/image";
import ThemeCatalog, { type CatalogInitial } from "@/components/ThemeCatalog";
import { EVENT_LABELS, type EventType } from "@/data/themes";

import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Dijital davetiyeler",
  description: "Düğün, nişan ve kına için telefon ekranına göre hazırlanmış davetiyeler. Satın almadan tam ekran önizleyin, tek bağlantıyla paylaşın.",
  path: "/tr/temalar",
});

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ThemesPage({ searchParams }: { searchParams: Promise<SP> }) {
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
          <p className="eyebrow">Koleksiyon</p>
          <h1 className="page-hero__title">Her etkinlik için bir davetiye</h1>
          <p className="page-hero__lead">
            Hepsi telefon için tasarlandı, hepsi tek bağlantıyla paylaşılır. Seçtiğiniz davetiyeyi
            satın almadan tam ekran önizleyebilirsiniz.
          </p>
          <p className="page-hero__script" aria-hidden="true">
            Özel anlar, özel davetiyelerle daha anlamlı…
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
