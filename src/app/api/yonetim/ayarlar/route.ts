import { NextResponse } from "next/server";
import { isValidIban } from "@/lib/format";
import type { PaymentSettings } from "@/lib/catalog";
import { getPublicCatalog, saveSettings } from "@/lib/store";

export async function GET() {
  const cat = await getPublicCatalog();
  return NextResponse.json({ settings: cat.settings, paymentReady: cat.paymentReady });
}

export async function PUT(req: Request) {
  let body: Partial<PaymentSettings> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const iban = String(body.iban || "").replace(/\s+/g, "").toUpperCase();
  if (!isValidIban(iban)) {
    return NextResponse.json({ error: "IBAN geçersiz. TR ile başlayan 26 karakter olmalı." }, { status: 400 });
  }
  if (String(body.accountHolder || "").trim().length < 3) {
    return NextResponse.json({ error: "Hesap sahibi adını yazın." }, { status: 400 });
  }
  await saveSettings({
    bankName: String(body.bankName || ""),
    accountHolder: String(body.accountHolder || ""),
    iban,
    instructions: String(body.instructions || ""),
    supportEmail: String(body.supportEmail || ""),
    supportPhone: String(body.supportPhone || ""),
  });
  return NextResponse.json({ ok: true });
}
