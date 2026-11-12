import { NextResponse } from "next/server";
import { newspapers } from "@/data/newspapers";
import { getPublicCatalog, savePapers, type PaperEdit } from "@/lib/store";

export async function GET() {
  const cat = await getPublicCatalog();
  const items = newspapers.map((n) => ({
    slug: n.slug,
    title: n.title,
    cover: n.cover ?? "",
    current: cat.newspapers[n.slug],
    base: { price: n.price, compareAt: n.compareAt, hidden: false },
  }));
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  let body: { items?: PaperEdit[] } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!Array.isArray(body.items)) return NextResponse.json({ error: "Liste eksik." }, { status: 400 });
  await savePapers(body.items);
  return NextResponse.json({ ok: true });
}
