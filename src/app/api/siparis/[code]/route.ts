import { NextResponse } from "next/server";
import { findOrderForCustomer, getPublicCatalog, reportTransfer } from "@/lib/store";
import { removeReceipt, saveReceipt } from "@/lib/receipt";
import { shareForOrder } from "@/lib/shareLink";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const email = new URL(req.url).searchParams.get("email") || "";
  const order = await findOrderForCustomer(code, email);
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  const cat = await getPublicCatalog();
  const share = await shareForOrder(order.code);
  return NextResponse.json({ order, share, settings: cat.settings, paymentReady: cat.paymentReady });
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const type = req.headers.get("content-type") || "";
  let email = "";
  let senderName = "";
  let file: File | null = null;
  if (type.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Dekont okunamadı." }, { status: 400 });
    }
    email = String(form.get("email") || "");
    senderName = String(form.get("senderName") || "");
    const uploaded = form.get("dekont");
    file = uploaded instanceof File ? uploaded : null;
  } else {
    let body: { email?: string; senderName?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    email = body.email || "";
    senderName = body.senderName || "";
  }
  if (senderName.trim().length < 3) {
    return NextResponse.json({ error: "Ad soyad en az 3 karakter olmalı." }, { status: 400 });
  }
  if (!file || file.size < 8) {
    return NextResponse.json({ error: "Dekont yükleyin. JPG, PNG, WEBP veya PDF, en fazla 5 MB." }, { status: 400 });
  }
  const known = await findOrderForCustomer(code, email);
  if (!known) return NextResponse.json({ error: "Sipariş bulunamadı. Kod ve e-posta birlikte kontrol edilir." }, { status: 404 });
  if (known.status === "onaylandi") {
    return NextResponse.json({ error: "Bu sipariş zaten onaylanmış." }, { status: 400 });
  }
  const hadReceipt = Boolean(known.snapshot.__dekont);
  const saved = await saveReceipt(code, new Uint8Array(await file.arrayBuffer()));
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });
  const result = await reportTransfer(code, email, senderName, saved.ext);
  if (!result.ok) {
    if (!hadReceipt) await removeReceipt(code);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const cat = await getPublicCatalog();
  return NextResponse.json({ order: result.order, settings: cat.settings, paymentReady: cat.paymentReady });
}
