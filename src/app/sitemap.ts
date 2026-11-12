import type { MetadataRoute } from "next";
import { newspapers } from "@/data/newspapers";
import { themes } from "@/data/themes";
import { siteUrl } from "@/lib/seo";

const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/tr", priority: 1, changeFrequency: "weekly" },
  { path: "/tr/temalar", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tr/gazeteler", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tr/dugun-davetiyesi", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tr/kina-davetiyesi", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tr/kina-ve-dugun-davetiyesi", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tr/tasarim-studyosu", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tr/fiyatlar", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tr/ne-sunuyoruz", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tr/nasil-calisir", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tr/sss", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tr/rehber", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tr/hakkimizda", priority: 0.5, changeFrequency: "yearly" },
  { path: "/tr/iletisim", priority: 0.5, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const now = new Date();
  return [
    ...PAGES.map((page) => ({
      url: `${origin}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...themes.map((theme) => ({
      url: `${origin}/tr/temalar/${theme.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...newspapers.map((paper) => ({
      url: `${origin}/tr/gazeteler/${paper.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
