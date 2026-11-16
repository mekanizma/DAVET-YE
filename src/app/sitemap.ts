import type { MetadataRoute } from "next";
import { newspapers } from "@/data/newspapers";
import { themes } from "@/data/themes";
import { siteUrl } from "@/lib/seo";

const PATHS = [
  "",
  "/temalar",
  "/gazeteler",
  "/dugun-davetiyesi",
  "/kina-davetiyesi",
  "/kina-ve-dugun-davetiyesi",
  "/tasarim-studyosu",
  "/fiyatlar",
  "/ne-sunuyoruz",
  "/nasil-calisir",
  "/sss",
  "/rehber",
  "/hakkimizda",
  "/iletisim",
];

const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = ["tr", "en"].flatMap((locale) =>
  PATHS.map((path) => ({
    path: `/${locale}${path}`,
    priority: path === "" ? 1 : path === "/temalar" || path === "/gazeteler" ? 0.9 : 0.7,
    changeFrequency: (path === "" || path === "/temalar" || path === "/gazeteler" || path === "/tasarim-studyosu" ? "weekly" : "monthly") as MetadataRoute.Sitemap[number]["changeFrequency"],
  })),
);

function langAlts(origin: string, pathAfterLocale: string) {
  const bare = pathAfterLocale.startsWith("/") ? pathAfterLocale : `/${pathAfterLocale}`;
  return {
    languages: {
      "tr-TR": `${origin}/tr${bare === "/" ? "" : bare}`,
      en: `${origin}/en${bare === "/" ? "" : bare}`,
      "x-default": `${origin}/tr${bare === "/" ? "" : bare}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const now = new Date();
  return [
    ...PAGES.map((page) => {
      const after = page.path.replace(/^\/(tr|en)/, "") || "/";
      return {
        url: `${origin}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: langAlts(origin, after === "" ? "/" : after),
      };
    }),
    ...["tr", "en"].flatMap((locale) => themes.map((theme) => ({
      url: `${origin}/${locale}/temalar/${theme.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: langAlts(origin, `/temalar/${theme.slug}`),
    }))),
    ...["tr", "en"].flatMap((locale) => newspapers.map((paper) => ({
      url: `${origin}/${locale}/gazeteler/${paper.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: langAlts(origin, `/gazeteler/${paper.slug}`),
    }))),
  ];
}
