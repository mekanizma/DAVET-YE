import { NextResponse } from "next/server";
import { hasTimesDesign, loadTimesDesign } from "@/lib/times";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug) || !hasTimesDesign(slug)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const dil = new URL(req.url).searchParams.get("dil");
  const data = loadTimesDesign(slug, dil === "en" ? "en" : "tr");
  return NextResponse.json(data);
}
