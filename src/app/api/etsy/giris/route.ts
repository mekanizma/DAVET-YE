import { NextResponse } from "next/server";
import { isEtsyOpenChoice, redeemEtsyCode } from "@/lib/etsyStore";
import { setEtsyCookie, signEtsySession } from "@/lib/etsySession";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string) {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 15 * 60 * 1000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 20;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { code?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const code = typeof body.code === "string" ? body.code : "";
  const result = await redeemEtsyCode(code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const needsPick = isEtsyOpenChoice(result.item);
  const kind = needsPick ? "any" : result.item.kind === "davetiye" ? "davetiye" : "gazete";
  const token = signEtsySession({
    code: result.item.code,
    slug: result.item.productSlug,
    title: result.item.productTitle,
    kind,
  });
  const res = NextResponse.json({
    ok: true,
    slug: result.item.productSlug,
    title: result.item.productTitle,
    kind,
    code: result.item.code,
    needsPick,
    // Client must open the picker before any studio when the code is still open.
    next: needsPick ? "/etsy/sec" : "/etsy/tasarla",
  });
  setEtsyCookie(res, token);
  return res;
}
