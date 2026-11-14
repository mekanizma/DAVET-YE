import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { CatalogProvider } from "@/components/CatalogProvider";
import { SITE } from "@/data/site";
import { LocaleProvider } from "@/i18n/provider";
import { htmlLang } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { GEO, HOME_DESCRIPTION, HOME_TITLE, siteUrl } from "@/lib/seo";
import { getPublicCatalog } from "@/lib/store";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

// Local fonts shipped in /public/fonts (no third-party hotlinking at runtime)
const allura = localFont({
  src: "../../public/fonts/allura.woff2",
  variable: "--font-allura",
  weight: "400",
  display: "swap",
});

const fraunces = localFont({
  src: "../../public/fonts/fraunces.shv99f85vx.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
});

const cinzel = localFont({
  src: "../../public/fonts/cinzel.woff2",
  variable: "--font-cinzel",
  weight: "400 900",
  display: "swap",
});

const greatVibes = localFont({
  src: "../../public/fonts/greatvibes.woff2",
  variable: "--font-greatvibes",
  weight: "400",
  display: "swap",
});

const cormorant = localFont({
  src: "../../public/fonts/cormorantgaramond.woff2",
  variable: "--font-cormorant",
  weight: "300 700",
  display: "swap",
});

const bebas = localFont({
  src: "../../public/fonts/bebasneue.woff2",
  variable: "--font-bebas",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: HOME_TITLE,
    template: "%s · Davetanisi",
  },
  description: HOME_DESCRIPTION,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: "/tr" }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "Dijital davetiye",
  keywords: [
    "dijital davetiye",
    "düğün davetiyesi",
    "kına davetiyesi",
    "nişan davetiyesi",
    "online davetiye",
    "düğün gazetesi",
    "katılım formu",
    "Davetanisi",
    "İstanbul",
    "Türkiye",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: SITE.name,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: HOME_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/og.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: GEO,
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  /* Keyboard overlays the page instead of shrinking it, so invite pages do not jump. */
  interactiveWidget: "overlays-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0d3229" },
  ],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const path = (await headers()).get("x-pathname") || "";
  const admin = path === "/yonetim" || path.startsWith("/yonetim/");
  if (admin) {
    return (
      <html lang="tr" className={`${playfair.variable} ${inter.variable}`}>
        <body>{children}</body>
      </html>
    );
  }
  const [loaded, locale] = await Promise.all([getPublicCatalog(), getLocale()]);
  const catalog = {
    ...loaded,
    settings: { ...loaded.settings, bankName: "", accountHolder: "", iban: "", instructions: "" },
  };
  return (
    <html
      lang={htmlLang(locale)}
      className={`${playfair.variable} ${inter.variable} ${allura.variable} ${fraunces.variable} ${cinzel.variable} ${greatVibes.variable} ${cormorant.variable} ${bebas.variable}`}
    >
      <body>
        <LocaleProvider locale={locale}>
          <CatalogProvider catalog={catalog}>{children}</CatalogProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
