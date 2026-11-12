import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f1c19",
  viewportFit: "cover",
};

export default function TimesLayout({ children }: { children: React.ReactNode }) {
  return <div className="times-shell">{children}</div>;
}
