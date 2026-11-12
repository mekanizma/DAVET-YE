import { NextResponse } from "next/server";
import { readReceipt } from "@/lib/receipt";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const safe = code.trim().toUpperCase();
  if (!/^DV-[A-Z0-9]{4,24}$/.test(safe)) {
    return NextResponse.json({ error: "Sipariş kodu geçersiz." }, { status: 400 });
  }
  const file = await readReceipt(safe);
  if (!file) return NextResponse.json({ error: "Dekont bulunamadı." }, { status: 404 });
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename="dekont-${safe}.${file.ext}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
