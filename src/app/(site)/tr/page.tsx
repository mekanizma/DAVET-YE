import type { Metadata } from "next";
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
import { applyTheme } from "@/lib/catalog";
import { getPublicCatalog } from "@/lib/store";
import { FEATURED_SLUGS, themes } from "@/data/themes";

export const metadata: Metadata = {
  title: { absolute: "Davetanisi — Dijital davetiye & gazete" },
  description:
    "Telefonda açılan zarif dijital davetiyenizi ve hikâyenizi manşete taşıyan gazetenizi dakikalar içinde hazırlayın.",
};

export default async function HomePage() {
  const cat = await getPublicCatalog();
  const rank = (slug: string) => {
    const i = FEATURED_SLUGS.indexOf(slug as (typeof FEATURED_SLUGS)[number]);
    return i === -1 ? 1000 + (themes.find((t) => t.slug === slug)?.order ?? 0) : i;
  };
  const featured = themes
    .map((t) => applyTheme(t, cat))
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
