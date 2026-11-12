import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/yonetim", "/panel", "/onizleme", "/api/", "/times", "/tr/tasarla", "/tr/davetiye-olustur", "/tr/gazete-tasarla", "/tr/gazete-olustur"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
