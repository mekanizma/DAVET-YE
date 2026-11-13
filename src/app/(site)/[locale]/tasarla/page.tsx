import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Editor from "@/components/studio/Editor";
import { isLocale } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: locale === "en" ? "Invitation card editor" : "KendinTasarla — düzenleyici",
    robots: { index: false },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const en = locale === "en";
  const sp = await searchParams;
  const t = typeof sp.tasarim === "string" ? sp.tasarim : undefined;
  return (
    <section className="section section--tight">
      <div className="wrap wrap--lg">
        <header className="page-title">
          <p className="eyebrow">{en ? "Design it yourself" : "KendinTasarla"}</p>
          <h1>{en ? "Invitation card editor" : "Davetiye kartı düzenleyici"}</h1>
          <p>
            {en
              ? "Change the text, colours, and layout. The card updates live."
              : "Metni, renkleri ve yerleşimi değiştirin; kartınız canlı güncellenir."}
          </p>
        </header>
        <Editor key={t ?? "son"} initialPreset={t} />
      </div>
    </section>
  );
}
