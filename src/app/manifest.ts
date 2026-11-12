import type { MetadataRoute } from "next";
import { HOME_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Davetanisi",
    short_name: "Davetanisi",
    description: HOME_DESCRIPTION,
    start_url: "/tr",
    scope: "/",
    display: "standalone",
    background_color: "#f8f4ec",
    theme_color: "#0d3229",
    lang: "tr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
