import { NextResponse } from "next/server";
import { customerPaymentSettings } from "@/lib/catalog";
import { createStudioDownloadOrder, getPublicCatalog } from "@/lib/store";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return NextResponse.json({ error: "Çok fazla sipariş denemesi. Biraz sonra yeniden deneyin." }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "İstek okunamadı." }, { status: 400 });
  }

  const customer = (body.customer && typeof body.customer === "object" ? body.customer : {}) as Record<string, unknown>;
  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) userId = user.id;
  } catch {
    userId = null;
  }

  const result = await createStudioDownloadOrder({
    customer: {
      name: typeof customer.name === "string" ? customer.name : "",
      email: typeof customer.email === "string" ? customer.email : "",
      phone: typeof customer.phone === "string" ? customer.phone : "",
    },
    customerNote: typeof body.customerNote === "string" ? body.customerNote : "",
    presetId: typeof body.presetId === "string" ? body.presetId : "",
    userId,
    locale: body.locale === "en" ? "en" : "tr",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const cat = await getPublicCatalog();
  return NextResponse.json({
    order: result.order,
    settings: customerPaymentSettings(cat.settings),
    paymentReady: cat.paymentReady,
    cardPayments: cat.cardPayments,
    bankTransfer: cat.bankTransfer,
    shopierUrl:
      cat.cardPayments && result.order.total > 0 && result.order.status !== "onaylandi"
        ? `/api/siparis/${encodeURIComponent(result.order.code)}/shopier?email=${encodeURIComponent(result.order.customer.email)}`
        : null,
  });
}
