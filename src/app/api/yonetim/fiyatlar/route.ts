import { NextResponse } from "next/server";
import { ADDONS, PRICE_FEATURES } from "@/data/pricing";
import { STUDIO_PRICE_DEFAULT, defaultAddon } from "@/lib/catalog";
import { getPublicCatalog, savePricing, type AddonEdit } from "@/lib/store";

export async function GET() {
  const cat = await getPublicCatalog();
  return NextResponse.json({
    addons: cat.addons,
    defaults: ADDONS.map(defaultAddon),
    studioPrice: cat.studioPrice,
    studioDefault: STUDIO_PRICE_DEFAULT,
    features: cat.features,
    defaultFeatures: PRICE_FEATURES,
  });
}

export async function PUT(req: Request) {
  let body: { addons?: AddonEdit[]; studioPrice?: number; features?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!Array.isArray(body.addons) || !Array.isArray(body.features)) {
    return NextResponse.json({ error: "Fiyat listesi eksik." }, { status: 400 });
  }
  const addons = body.addons.map((a) => ({
    ...a,
    was: a.was == null || (a.was as unknown) === "" ? null : Number(a.was),
  }));
  await savePricing({
    addons,
    studioPrice: Number(body.studioPrice),
    features: body.features.filter((x) => typeof x === "string"),
  });
  return NextResponse.json({ ok: true });
}
