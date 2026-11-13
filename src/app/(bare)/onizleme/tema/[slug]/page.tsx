import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InvitationExperience from "@/components/invitation/InvitationExperience";
import StageView from "@/components/stage/StageView";
import { themeTitle } from "@/i18n/catalog";
import { getLocale } from "@/i18n/server";
import { getTheme, themes } from "@/data/themes";

function loadStage(slug: string) {
  const file = path.join(process.cwd(), "src/data/stages", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function generateStaticParams() {
  return themes.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const t = getTheme(slug);
  return {
    title: t ? `${themeTitle(t, locale)} — ${locale === "en" ? "preview" : "önizleme"}` : locale === "en" ? "Preview" : "Önizleme",
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const theme = getTheme(slug);
  if (!theme) notFound();
  const embed = sp.embed === "1";
  const mode = sp.mod === "kina-dugun" ? "kina-dugun" : "tek";
  const stage = loadStage(slug);
  if (stage) {
    return <StageView stage={stage} slug={slug} embed={embed} useDraftData={sp.taslak === "1"} />;
  }
  return <InvitationExperience theme={theme} embed={embed} mode={mode} useDraftData={sp.taslak === "1"} />;
}
