import { NextResponse } from "next/server";
import { newspapers } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { createEtsyCode, listEtsyCodes, revokeEtsyCode } from "@/lib/etsyStore";

export async function GET() {
  const items = await listEtsyCodes();
  const papers = newspapers.map((n) => {
    const en = localizeNewspaper(n, "en");
    return { slug: n.slug, title: n.title, titleEn: en.title };
  });
  return NextResponse.json({ items, papers });
}

export async function POST(req: Request) {
  let body: { newspaperSlug?: string; note?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const slug = typeof body.newspaperSlug === "string" ? body.newspaperSlug.trim() : "";
  if (!slug) return NextResponse.json({ error: "Gazete seçin." }, { status: 400 });
  const result = await createEtsyCode({ newspaperSlug: slug, note: body.note });
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
