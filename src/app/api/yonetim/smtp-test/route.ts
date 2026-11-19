import { NextResponse } from "next/server";
import { probeMail } from "@/lib/mail";

/** Admin-only (middleware). Sends a test message to SUPPORT_NOTIFY_EMAILS / info@mekanizma.com. */
export async function POST() {
  const result = await probeMail();
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        configured: result.configured,
        hint:
          "Render free plan SMTP 465/587 kapalıdır. Starter’a geçin veya mekanizma.com üzerine mail-relay yükleyip MAIL_RELAY_URL / MAIL_RELAY_SECRET ekleyin.",
      },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    via: result.via,
    configured: result.configured,
    to: "info@mekanizma.com (+ SUPPORT_NOTIFY_EMAILS)",
  });
}
