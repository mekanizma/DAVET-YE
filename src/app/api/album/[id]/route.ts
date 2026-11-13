import { NextResponse } from "next/server";
import { albumMime, deleteUserPhoto, readUserPhoto } from "@/lib/album";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

async function viewer() {
  if (!supabaseConfigured()) return null;
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user?.email) return null;
  return user;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await viewer();
  if (!user?.email) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const { id } = await ctx.params;
  const file = await readUserPhoto(user.id, user.email, id);
  if (!file) return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  const download = new URL(req.url).searchParams.get("indir") === "1";
  const name = `ani-${id.slice(0, 8)}.${file.ext}`;
  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": albumMime(file.ext),
      "Content-Length": String(file.bytes.byteLength),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await viewer();
  if (!user?.email) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteUserPhoto(user.id, user.email, id);
  if (!ok) return NextResponse.json({ error: "Fotoğraf silinemedi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
