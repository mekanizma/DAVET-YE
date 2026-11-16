import { NextResponse } from "next/server";
import { listShareRsvps, saveShareRsvp } from "@/lib/rsvp";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string) {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 10 * 60 * 1000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 80;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const rsvps = await listShareRsvps(slug);
  if (!rsvps) return NextResponse.json({ error: "Katılım formu açık değil." }, { status: 404 });
  return NextResponse.json({ rsvps }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Çok fazla yanıt. Biraz sonra yeniden deneyin." }, { status: 429 });
  const { slug } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanıt okunamadı." }, { status: 400 });
  }
  const saved = await saveShareRsvp(slug, {
    name: String(body.name || ""),
    attending: Boolean(body.attending),
    count: Number(body.count),
    children: Number(body.children),
    meal: String(body.meal || ""),
    transfer: String(body.transfer || ""),
    note: String(body.note || ""),
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json(saved.rsvp, { status: 201 });
}
