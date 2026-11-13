import { NextResponse } from "next/server";
import { listSharePhotos, saveSharePhoto, type AlbumSource } from "@/lib/album";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string) {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 10 * 60 * 1000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 40;
}

function sourceOf(value: FormDataEntryValue | null): AlbumSource | null {
  return value === "wall" || value === "lens" ? value : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const photos = await listSharePhotos(slug);
  if (!photos) return NextResponse.json({ error: "Albüm açık değil." }, { status: 404 });
  return NextResponse.json({
    photos: photos.map((photo) => ({
      id: photo.id,
      source: photo.source,
      createdAt: photo.createdAt,
      url: `/api/d/${encodeURIComponent(slug)}/foto/${photo.id}`,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Çok fazla fotoğraf. Biraz sonra yeniden deneyin." }, { status: 429 });
  const { slug } = await ctx.params;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Fotoğraf okunamadı." }, { status: 400 });
  }
  const source = sourceOf(form.get("kaynak"));
  const file = form.get("foto");
  if (!source || !(file instanceof File)) return NextResponse.json({ error: "Fotoğraf eksik." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Fotoğraf 8 MB’ı geçmemeli." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const saved = await saveSharePhoto(slug, source, bytes);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({
    id: saved.id,
    url: `/api/d/${encodeURIComponent(slug)}/foto/${saved.id}`,
  }, { status: 201 });
}
