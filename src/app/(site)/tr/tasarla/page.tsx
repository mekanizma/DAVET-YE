import type { Metadata } from "next";
import Editor from "@/components/studio/Editor";

export const metadata: Metadata = { title: "KendinTasarla — düzenleyici", robots: { index: false } };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = typeof sp.tasarim === "string" ? sp.tasarim : undefined;
  return (
    <section className="section section--tight">
      <div className="wrap wrap--lg">
        <header className="page-title">
          <p className="eyebrow">KendinTasarla</p>
          <h1>Davetiye kartı düzenleyici</h1>
          <p>Metni, renkleri ve yerleşimi değiştirin; kartınız canlı güncellenir.</p>
        </header>
        <Editor key={t ?? "son"} initialPreset={t} />
      </div>
    </section>
  );
}
