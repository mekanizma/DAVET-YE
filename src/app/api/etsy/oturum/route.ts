import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ETSY_COOKIE, readEtsySession } from "@/lib/etsySession";
import { getEtsyCode } from "@/lib/etsyStore";

export async function GET() {
  const jar = await cookies();
  const session = readEtsySession(jar.get(ETSY_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false });

  const row = await getEtsyCode(session.code);
  if (!row || row.status === "revoked") {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({
    ok: true,
    code: session.code,
    slug: session.slug,
    title: session.title,
  });
}
