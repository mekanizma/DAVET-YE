import { NextResponse } from "next/server";
import { listShareWishes, saveShareWish } from "@/lib/wishes";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string) {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 10 * 60 * 1000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 60;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const wishes = await listShareWishes(slug);
  if (!wishes) return NextResponse.json({ error: "Dilekler açık değil." }, { status: 404 });
  return NextResponse.json(
    { wishes },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Çok fazla dilek. Biraz sonra yeniden deneyin." }, { status: 429 });
  const { slug } = await ctx.params;
  let body: { name?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dilek okunamadı." }, { status: 400 });
  }
  const saved = await saveShareWish(slug, String(body.name || ""), String(body.text || ""));
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json(saved.wish, { status: 201 });
}
