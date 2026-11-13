import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/yonetim", "/panel", "/onizleme", "/api/", "/times", "/tr/tasarla", "/en/tasarla", "/tr/davetiye-olustur", "/en/davetiye-olustur", "/tr/gazete-tasarla", "/en/gazete-tasarla", "/tr/gazete-olustur", "/en/gazete-olustur", "/tr/etsy", "/en/etsy"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
