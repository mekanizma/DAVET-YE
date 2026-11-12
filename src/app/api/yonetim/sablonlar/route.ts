import { NextResponse } from "next/server";
import { themes } from "@/data/themes";
import { defaultThemeLive } from "@/lib/catalog";
import { getPublicCatalog, saveThemes, type ThemeEdit } from "@/lib/store";

export async function GET() {
  const cat = await getPublicCatalog();
  const items = themes.map((t) => ({
    slug: t.slug,
    title: t.title,
    cover: t.cover,
    eventTypes: t.eventTypes,
    current: cat.themes[t.slug],
    base: defaultThemeLive(t),
  }));
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  let body: { items?: ThemeEdit[] } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!Array.isArray(body.items)) return NextResponse.json({ error: "Liste eksik." }, { status: 400 });
  await saveThemes(body.items);
  return NextResponse.json({ ok: true });
}
