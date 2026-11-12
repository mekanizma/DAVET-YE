import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { CatalogProvider } from "@/components/CatalogProvider";
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
  title: {
    default: "Davetanisi — Dijital davetiye & gazete",
    template: "%s · Davetanisi",
  },
  description:
    "Telefonda açılan zarif dijital davetiye ve sayfa çevirmeli gazete. Davetanisi ile davetinizi dakikalar içinde hazırlayın.",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f4ec",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getPublicCatalog();
  return (
    <html
      lang="tr"
      className={`${playfair.variable} ${inter.variable} ${allura.variable} ${fraunces.variable} ${cinzel.variable} ${greatVibes.variable} ${cormorant.variable} ${bebas.variable}`}
    >
      <body>
        <CatalogProvider catalog={catalog}>{children}</CatalogProvider>
      </body>
    </html>
  );
}
