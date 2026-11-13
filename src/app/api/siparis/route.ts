import { NextResponse } from "next/server";
import { customerPaymentSettings } from "@/lib/catalog";
import { getPublicCatalog, createOrderAsync } from "@/lib/store";
import { reserveShare } from "@/lib/shareLink";
import { createSupabaseServer } from "@/lib/supabase/server";

const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.at > 10 * 60 * 1000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  row.n += 1;
  return row.n > 20;
}

function list(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 40)).slice(0, 20);
}

function snapshot(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v).slice(0, 12)) {
    if (typeof val === "string") out[k.slice(0, 40)] = val;
  }
  return out;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Çok fazla sipariş denemesi. Biraz sonra yeniden deneyin." }, { status: 429 });
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "İstek okunamadı." }, { status: 400 });
  }
  const kind = body.kind === "gazete" ? "gazete" : body.kind === "davetiye" ? "davetiye" : null;
  if (!kind) return NextResponse.json({ error: "Sipariş türü geçersiz." }, { status: 400 });
  const customer = (body.customer && typeof body.customer === "object" ? body.customer : {}) as Record<string, unknown>;
  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) userId = user.id;
  } catch {
    userId = null;
  }
  const result = await createOrderAsync({
    kind,
    template: typeof body.template === "string" ? body.template : "",
    languages: list(body.languages),
    addons: list(body.addons),
    customer: {
      name: typeof customer.name === "string" ? customer.name : "",
      email: typeof customer.email === "string" ? customer.email : "",
      phone: typeof customer.phone === "string" ? customer.phone : "",
    },
    customerNote: typeof body.customerNote === "string" ? body.customerNote : "",
    snapshot: snapshot(body.snapshot),
    userId,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const share = await reserveShare({
    order: result.order,
    hint: typeof body.shareSlug === "string" ? body.shareSlug : "",
    design: body.design,
    locale: body.locale === "en" ? "en" : "tr",
  });
  const cat = await getPublicCatalog();
  return NextResponse.json({ order: result.order, share, settings: customerPaymentSettings(cat.settings), paymentReady: cat.cardPayments });
}
