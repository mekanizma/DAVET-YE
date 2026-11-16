import { NextResponse } from "next/server";
import { listSupportRequests, updateSupportStatus, type SupportStatus } from "@/lib/support";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const durum = url.searchParams.get("durum") || "";
  const items = await listSupportRequests(durum === "new" || durum === "read" || durum === "done" ? durum : "");
  if (!items) {
    return NextResponse.json({ error: "Destek listesi okunamadı." }, { status: 503 });
  }
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  const status = body.status;
  if (status !== "new" && status !== "read" && status !== "done") {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }
  const updated = await updateSupportStatus(String(body.id || ""), status as SupportStatus);
  if (!updated.ok) {
    return NextResponse.json({ error: updated.error }, { status: updated.status });
  }
  return NextResponse.json({ ok: true });
}
