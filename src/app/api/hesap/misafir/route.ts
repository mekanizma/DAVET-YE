import { NextResponse } from "next/server";
import { listUserAlbum } from "@/lib/album";
import { listUserRsvps } from "@/lib/rsvp";
import { listUserWishes } from "@/lib/wishes";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Misafir panosu kullanılamıyor." }, { status: 503 });
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const [rsvps, wishes, photos] = await Promise.all([
    listUserRsvps(user.id, user.email),
    listUserWishes(user.id, user.email),
    listUserAlbum(user.id, user.email),
  ]);
  if (!rsvps || !wishes || !photos) {
    return NextResponse.json({ error: "Misafir verileri okunamadı." }, { status: 500 });
  }

  const attending = rsvps.filter((row) => row.attending);
  const guests = attending.reduce((sum, row) => sum + row.count, 0);
  const children = attending.reduce((sum, row) => sum + row.children, 0);

  return NextResponse.json(
    {
      summary: {
        rsvpTotal: rsvps.length,
        attending: attending.length,
        declining: rsvps.length - attending.length,
        guests,
        children,
        wishes: wishes.length,
        photos: photos.length,
        lens: photos.filter((photo) => photo.source === "lens").length,
        wall: photos.filter((photo) => photo.source === "wall").length,
      },
      rsvps,
      wishes: wishes.slice(0, 100),
      recentPhotos: photos.slice(0, 12).map((photo) => ({
        id: photo.id,
        title: photo.title,
        source: photo.source,
        createdAt: photo.createdAt,
        url: photo.url || "",
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
