import { NextResponse } from "next/server";
import { probeMail } from "@/lib/mail";

/** Admin-only. Sends a test message to info@mekanizma.com (+ SUPPORT_NOTIFY_EMAILS). */
export async function POST() {
  const result = await probeMail();
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        configured: result.configured,
        hint: "Destek maili Supabase fonksiyonundan gider (doğrulama / şifre sıfırlama ile aynı taraf).",
      },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    via: result.via,
    configured: result.configured,
    to: "info@mekanizma.com",
  });
}
