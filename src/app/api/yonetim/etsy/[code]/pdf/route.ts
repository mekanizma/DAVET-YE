import { NextResponse } from "next/server";
import { getNewspaper } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { buildEtsyGuidePdf } from "@/lib/etsyPdf";
import { getEtsyCode, isEtsyCodeFormat } from "@/lib/etsyStore";

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

  const paper = getNewspaper(item.newspaperSlug);
  const english = paper ? localizeNewspaper(paper, "en") : null;
  const pdf = buildEtsyGuidePdf({
    code: item.code,
    newspaperTitle: english?.title || item.newspaperTitle,
    description: english?.description || paper?.description || "",
    headline: english?.headline || paper?.headline || "",
    coverPath: english?.cover || paper?.cover,
    accent: paper?.accent,
    ink: paper?.ink,
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="davetanisi-${item.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
