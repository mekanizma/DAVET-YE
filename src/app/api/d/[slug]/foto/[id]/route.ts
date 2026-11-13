import { NextResponse } from "next/server";
import { albumMime, readSharePhoto } from "@/lib/album";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const file = await readSharePhoto(slug, id);
  if (!file) return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": albumMime(file.ext),
      "Content-Length": String(file.bytes.byteLength),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
