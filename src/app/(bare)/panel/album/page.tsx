import type { Metadata } from "next";
import AlbumView from "@/components/panel/AlbumView";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "Album" : "Albüm" };
}

export default async function Page() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <p className="eyebrow">{en ? "Album" : "Albüm"}</p>
          <h1>{en ? "Guest photographs" : "Misafir fotoğrafları"}</h1>
          <p className="muted">
            {en
              ? "Photos from the memory wall and memory shots arrive here. Open one to view it, or download it to your phone."
              : "Anı duvarı ve anı çekiminden gelen fotoğraflar burada toplanır. Birine dokunup bakabilir, telefonunuza indirebilirsiniz."}
          </p>
        </div>
      </header>
      <AlbumView />
    </div>
  );
}
