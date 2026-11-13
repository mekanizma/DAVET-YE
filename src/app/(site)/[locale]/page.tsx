import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinalCta from "@/components/FinalCta";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import PricingTeaser from "@/components/PricingTeaser";
import WhyDigital from "@/components/WhyDigital";
import CategoryDiscovery from "@/components/home/CategoryDiscovery";
import FeaturedDesigns from "@/components/home/FeaturedDesigns";
import HomeFaq from "@/components/home/HomeFaq";
import NewspaperStrip from "@/components/home/NewspaperStrip";
import { localizeTheme } from "@/i18n/catalog";
import { isLocale, lp } from "@/i18n/locale";
import { HOME_DESCRIPTION_EN, HOME_TITLE_EN } from "@/i18n/marketing";
import { applyTheme } from "@/lib/catalog";
import { getPublicCatalog } from "@/lib/store";
import { FEATURED_SLUGS, themes } from "@/data/themes";
import { HOME_DESCRIPTION, HOME_TITLE, pageMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMeta({
    title: locale === "en" ? HOME_TITLE_EN : HOME_TITLE,
    description: locale === "en" ? HOME_DESCRIPTION_EN : HOME_DESCRIPTION,
    path: lp(locale),
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const cat = await getPublicCatalog();
  const rank = (slug: string) => {
    const i = FEATURED_SLUGS.indexOf(slug as (typeof FEATURED_SLUGS)[number]);
    return i === -1 ? 1000 + (themes.find((t) => t.slug === slug)?.order ?? 0) : i;
  };
  const featured = themes
    .map((t) => localizeTheme(applyTheme(t, cat), locale))
    .filter((t) => cat.themes[t.slug]?.featured && !cat.themes[t.slug]?.hidden)
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .slice(0, 8);
  return (
    <div className="home-v2">
      <Hero featured={featured} />
      <CategoryDiscovery />
      <FeaturedDesigns themes={featured} />
      <NewspaperStrip />
      <HowItWorks />
      <Features themes={featured} />
      <WhyDigital />
      <PricingTeaser />
      <HomeFaq />
      <FinalCta />
    </div>
  );
}
