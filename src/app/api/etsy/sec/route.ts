import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { newspapers } from "@/data/newspapers";
import { themes } from "@/data/themes";
import { localizeNewspaper, themeTitle } from "@/i18n/catalog";
import { ETSY_COOKIE, readEtsySession, setEtsyCookie, signEtsySession } from "@/lib/etsySession";
import { getEtsyCode, isEtsyOpenChoice, lockEtsyProduct } from "@/lib/etsyStore";

export async function GET() {
  const jar = await cookies();
  const session = readEtsySession(jar.get(ETSY_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const row = await getEtsyCode(session.code);
  if (!row || row.status === "revoked") return NextResponse.json({ ok: false }, { status: 401 });

  if (!isEtsyOpenChoice(row.productSlug)) {
    return NextResponse.json({
      ok: true,
      locked: true,
      kind: row.kind,
      slug: row.productSlug,
      title: row.productTitle,
      code: row.code,
    });
  }

  const options =
    row.kind === "davetiye"
      ? themes.map((t) => ({ slug: t.slug, title: t.title, titleEn: themeTitle(t, "en") }))
      : newspapers.map((n) => {
          const en = localizeNewspaper(n, "en");
          return { slug: n.slug, title: n.title, titleEn: en.title };
        });

  return NextResponse.json({
    ok: true,
    locked: false,
    kind: row.kind,
    code: row.code,
    options,
  });
}

export async function POST(req: Request) {
  const jar = await cookies();
  const session = readEtsySession(jar.get(ETSY_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Enter your access code again." }, { status: 401 });

  let body: { slug?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) return NextResponse.json({ error: "Choose a design." }, { status: 400 });

  const result = await lockEtsyProduct(session.code, slug);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const token = signEtsySession({
    code: result.item.code,
    slug: result.item.productSlug,
    title: result.item.productTitle,
    kind: result.item.kind,
  });
  const res = NextResponse.json({
    ok: true,
    slug: result.item.productSlug,
    title: result.item.productTitle,
    kind: result.item.kind,
    code: result.item.code,
  });
  setEtsyCookie(res, token);
  return res;
}
