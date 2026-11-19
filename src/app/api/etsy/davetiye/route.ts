import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createEtsyFreeOrder } from "@/lib/store";
import { ETSY_COOKIE, readEtsySession } from "@/lib/etsySession";
import { getEtsyCode } from "@/lib/etsyStore";
import { publishShare, reserveShare } from "@/lib/shareLink";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string) {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 15 * 60 * 1000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 12;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const jar = await cookies();
  const session = readEtsySession(jar.get(ETSY_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Etsy session missing. Enter your code again." }, { status: 401 });

  const row = await getEtsyCode(session.code);
  if (!row || row.status === "revoked") {
    return NextResponse.json({ error: "This access code is not valid." }, { status: 400 });
  }
  if (row.kind !== "davetiye") {
    return NextResponse.json({ error: "This code is for a newspaper, not an invitation." }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const customer = (body.customer && typeof body.customer === "object" ? body.customer : {}) as Record<string, unknown>;
  const languages = Array.isArray(body.languages)
    ? body.languages.filter((x): x is string => typeof x === "string").slice(0, 8)
    : ["en"];
  const addons = Array.isArray(body.addons)
    ? body.addons.filter((x): x is string => typeof x === "string").slice(0, 20)
    : [];
  const snapshot: Record<string, string> = {};
  if (body.snapshot && typeof body.snapshot === "object") {
    for (const [k, v] of Object.entries(body.snapshot as Record<string, unknown>).slice(0, 12)) {
      if (typeof v === "string") snapshot[k.slice(0, 40)] = v;
    }
  }

  const result = await createEtsyFreeOrder({
    kind: "davetiye",
    template: row.productSlug,
    languages,
    addons,
    customer: {
      name: typeof customer.name === "string" ? customer.name : "",
      email: typeof customer.email === "string" ? customer.email : "",
      phone: typeof customer.phone === "string" ? customer.phone : "",
    },
    customerNote: typeof body.customerNote === "string" ? body.customerNote : "",
    snapshot,
    etsyCode: row.code,
    locale: body.locale === "tr" ? "tr" : "en",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const share = await reserveShare({
    order: result.order,
    hint: typeof body.shareSlug === "string" ? body.shareSlug : "",
    design: body.design,
    locale: body.locale === "tr" ? "tr" : "en",
  });
  await publishShare(result.order);

  return NextResponse.json({ order: result.order, share }, { status: 201 });
}
