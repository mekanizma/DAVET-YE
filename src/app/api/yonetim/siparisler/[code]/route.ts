import { NextResponse } from "next/server";
import { decideOrder, findOrder } from "@/lib/store";
import { shareForOrder } from "@/lib/shareLink";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const order = await findOrder(code);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  return NextResponse.json({ order, share: await shareForOrder(order.code) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  let body: { action?: string; adminNote?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action = body.action === "onayla" || body.action === "reddet" || body.action === "not" ? body.action : null;
  if (!action) return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  const result = await decideOrder(code, action, typeof body.adminNote === "string" ? body.adminNote : "");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ order: result.order, share: await shareForOrder(result.order.code) });
}
