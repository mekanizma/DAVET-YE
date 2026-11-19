import { NextResponse } from "next/server";
import { createEtsyCode, listEtsyCodes, revokeEtsyCode } from "@/lib/etsyStore";

export async function GET() {
  const items = await listEtsyCodes();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  let body: { note?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const result = await createEtsyCode({ note: body.note });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ item: result.item });
}

export async function PATCH(req: Request) {
  let body: { code?: string; action?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.action !== "revoke" || typeof body.code !== "string") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const result = await revokeEtsyCode(body.code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
