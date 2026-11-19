import { NextResponse } from "next/server";
import { getNewspaper } from "@/data/newspapers";
import { coverOf, getTheme } from "@/data/themes";
import { localizeNewspaper, themeTitle } from "@/i18n/catalog";
import { buildEtsyGuidePdf } from "@/lib/etsyPdf";
import { etsyKindTitle, getEtsyCode, isEtsyCodeFormat, isEtsyOpenChoice } from "@/lib/etsyStore";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params;
  const code = decodeURIComponent(raw || "").trim().toUpperCase();
  if (!isEtsyCodeFormat(code)) {
    return NextResponse.json({ error: "Geçersiz kod." }, { status: 400 });
  }
  const item = await getEtsyCode(code);
  if (!item) return NextResponse.json({ error: "Kod bulunamadı." }, { status: 404 });
  if (item.status === "revoked") {
    return NextResponse.json({ error: "İptal edilmiş kod için PDF indirilemez." }, { status: 400 });
  }

  const kind = item.kind === "davetiye" ? "davetiye" : "gazete";
  const open = isEtsyOpenChoice(item.productSlug);

  if (kind === "davetiye") {
    const theme = open ? null : getTheme(item.productSlug);
    const pdf = buildEtsyGuidePdf({
      code: item.code,
      kind: "davetiye",
      newspaperTitle: theme ? themeTitle(theme, "en") : etsyKindTitle("davetiye", "en"),
      description: theme?.description
        || "Your code unlocks one free invitation of any design. Open the link, enter the code, pick one invitation, then design and share it.",
      headline: theme?.eyebrow || "Pick any invitation · 1 free",
      coverPath: theme ? coverOf(theme) : undefined,
      accent: theme?.colors.gold || theme?.colors.accent,
      ink: theme?.colors.accentDeep,
      openChoice: open,
    });
    return pdfResponse(pdf, item.code);
  }

  const paper = open ? null : getNewspaper(item.productSlug);
  const english = paper ? localizeNewspaper(paper, "en") : null;
  const pdf = buildEtsyGuidePdf({
    code: item.code,
    kind: "gazete",
    newspaperTitle: english?.title || etsyKindTitle("gazete", "en"),
    description: english?.description
      || "Your code unlocks one free newspaper of any design. Open the link, enter the code, pick one newspaper, then design and download it.",
    headline: english?.headline || "Pick any newspaper · 1 free",
    coverPath: english?.cover || paper?.cover,
    accent: paper?.accent,
    ink: paper?.ink,
    openChoice: open,
  });
  return pdfResponse(pdf, item.code);
}

function pdfResponse(pdf: Buffer, code: string) {
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="davetanisi-${code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
