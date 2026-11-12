import type { Metadata } from "next";
import { SITE } from "@/data/site";

const FALLBACK_ORIGIN = "https://davetanisii.onrender.com";

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

export const HOME_TITLE = "Davetanisi — Dijital davetiye ve düğün gazetesi";
export const HOME_DESCRIPTION =
  "Düğün, nişan ve kına için telefonda açılan dijital davetiye. Tek bağlantıyla paylaşın, katılım yanıtlarını izleyin, hikâyenizi Türkiye’de gazeteye taşıyın.";

export const GEO = {
  "geo.region": "TR",
  "geo.placename": "İstanbul, Türkiye",
  "geo.country": "TR",
  "content-language": "tr-TR",
};

export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
}): Metadata {
  const full = opts.title.includes("Davetanisi") ? opts.title : `${opts.title} · Davetanisi`;
  const image = opts.image || "/og.jpg";
  const index = opts.index !== false;
  return {
    title: { absolute: full },
    description: opts.description,
    alternates: {
      canonical: opts.path,
      languages: { "tr-TR": opts.path },
    },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: opts.path,
      siteName: SITE.name,
      title: full,
      description: opts.description,
      images: [{ url: image, width: 1200, height: 630, alt: full }],
    },
    twitter: {
      card: "summary_large_image",
      title: full,
      description: opts.description,
      images: [image],
    },
  };
}

export function siteGraph() {
  const origin = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: SITE.name,
        url: `${origin}/tr`,
        logo: {
          "@type": "ImageObject",
          url: `${origin}/icon-512.png`,
          width: 512,
          height: 512,
        },
        image: `${origin}/og.jpg`,
        areaServed: [
          { "@type": "Country", name: "Türkiye" },
          { "@type": "City", name: "İstanbul" },
        ],
        address: {
          "@type": "PostalAddress",
          addressLocality: "İstanbul",
          addressCountry: "TR",
        },
        sameAs: [SITE.instagram],
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: `${origin}/tr`,
        name: SITE.name,
        description: HOME_DESCRIPTION,
        inLanguage: "tr-TR",
        publisher: { "@id": `${origin}/#organization` },
      },
    ],
  };
}

export function productJsonLd(opts: { name: string; description: string; path: string; image?: string; price: number }) {
  const origin = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    image: opts.image ? new URL(opts.image, origin).toString() : `${origin}/og.jpg`,
    brand: { "@type": "Brand", name: SITE.name },
    areaServed: { "@type": "Country", name: "Türkiye" },
    offers: {
      "@type": "Offer",
      url: new URL(opts.path, origin).toString(),
      priceCurrency: "TRY",
      price: opts.price,
      availability: "https://schema.org/InStock",
      areaServed: "TR",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const origin = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: new URL(item.path, origin).toString(),
    })),
  };
}
