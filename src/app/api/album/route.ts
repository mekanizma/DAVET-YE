import { NextResponse } from "next/server";
import { listUserAlbum } from "@/lib/album";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Albüm kullanılamıyor." }, { status: 503 });
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user?.email) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const photos = await listUserAlbum(user.id, user.email);
  if (!photos) return NextResponse.json({ error: "Albüm okunamadı." }, { status: 500 });
  return NextResponse.json({
    photos: photos.map((photo) => ({
      id: photo.id,
      orderCode: photo.orderCode,
      title: photo.title,
      source: photo.source,
      createdAt: photo.createdAt,
      bytes: photo.bytes,
      url: photo.url || "",
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
