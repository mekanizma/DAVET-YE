import { NextResponse } from "next/server";
import { confirmShopierPayment } from "@/lib/store";
import { readShopierOrder, shopierPaidHit, verifyShopierWebhook } from "@/lib/shopier";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("shopier-signature") || "";
  if (!verifyShopierWebhook(raw, signature)) {
    return NextResponse.json({ error: "imza" }, { status: 401 });
  }
  const event = (req.headers.get("shopier-event") || "").trim();
  if (event && event !== "order.created") return NextResponse.json({ ok: true, ignored: event });
  let body: { id?: string } = {};
  try {
    body = JSON.parse(raw) as { id?: string };
  } catch {
    return NextResponse.json({ error: "govde" }, { status: 400 });
  }
  const remote = body.id ? await readShopierOrder(String(body.id)) : body;
  if (!remote || typeof remote !== "object") return NextResponse.json({ ok: false }, { status: 503 });
  const rough = remote as { id?: string; lineItems?: Array<{ productId?: string; title?: string }> };
  let confirmed = 0;
  for (const line of rough.lineItems || []) {
    const title = String(line.title || "");
    const code = title.toUpperCase().match(/DV-[A-Z0-9]{4,24}/)?.[0];
    const productId = String(line.productId || "");
    const hit = shopierPaidHit(remote, { code, productId, assumePaid: true });
    if (!hit) continue;
    const saved = await confirmShopierPayment({
      code,
      productId: hit.productId,
      shopierOrderId: hit.id,
      amount: hit.amount,
    });
    if (saved) confirmed += 1;
  }
  return NextResponse.json({ ok: true, confirmed });
}
