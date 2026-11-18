import { NextResponse } from "next/server";
import { clientIp, parseTrafficHit, recordTrafficHit } from "@/lib/traffic";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 60_000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 90;
}

export async function POST(req: Request) {
  if (limited(clientIp(req))) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = parseTrafficHit(body, req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const saved = await recordTrafficHit(parsed.hit);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
