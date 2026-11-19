import { NextResponse } from "next/server";
import { getNewspaper } from "@/data/newspapers";
import { coverOf, getTheme } from "@/data/themes";
import { localizeNewspaper, themeTitle } from "@/i18n/catalog";
import { buildEtsyGuidePdf } from "@/lib/etsyPdf";
import { etsyOpenTitle, getEtsyCode, isEtsyCodeFormat, isEtsyOpenChoice } from "@/lib/etsyStore";

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

  const open = isEtsyOpenChoice(item);

  if (open) {
    const pdf = buildEtsyGuidePdf({
      code: item.code,
      kind: "any",
      newspaperTitle: etsyOpenTitle("en"),
      description:
        "Your code unlocks one free product. Open the link, enter the code, choose newspaper or invitation, pick one design, then finish online.",
      headline: "1 free product · newspaper or invitation",
      openChoice: true,
    });
    return pdfResponse(pdf, item.code);
  }

  if (item.kind === "davetiye") {
    const theme = getTheme(item.productSlug);
    const pdf = buildEtsyGuidePdf({
      code: item.code,
      kind: "davetiye",
      newspaperTitle: theme ? themeTitle(theme, "en") : item.productTitle,
      description: theme?.description
        || "Your code unlocks one free invitation. Open the link, enter the code, then design and share it.",
      headline: theme?.eyebrow || "Your free invitation",
      coverPath: theme ? coverOf(theme) : undefined,
      accent: theme?.colors.gold || theme?.colors.accent,
      ink: theme?.colors.accentDeep,
      openChoice: false,
    });
    return pdfResponse(pdf, item.code);
  }

  const paper = getNewspaper(item.productSlug);
  const english = paper ? localizeNewspaper(paper, "en") : null;
  const pdf = buildEtsyGuidePdf({
    code: item.code,
    kind: "gazete",
    newspaperTitle: english?.title || item.productTitle,
    description: english?.description
      || "Your code unlocks one free newspaper. Open the link, enter the code, then design and download it.",
    headline: english?.headline || "Your free newspaper",
    coverPath: english?.cover || paper?.cover,
    accent: paper?.accent,
    ink: paper?.ink,
    openChoice: false,
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
