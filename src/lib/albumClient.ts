export type AlbumSource = "wall" | "lens";

export async function uploadSharePhoto(slug: string, file: Blob, source: AlbumSource, filename = "foto.jpg") {
  const body = new FormData();
  const named = file instanceof File ? file : new File([file], filename, { type: file.type || "image/jpeg" });
  body.set("foto", named);
  body.set("kaynak", source);
  const res = await fetch(`/api/d/${encodeURIComponent(slug)}/foto`, { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { id?: string; url?: string; error?: string };
  if (!res.ok || !data.id || !data.url) throw new Error(data.error || "Fotoğraf kaydedilemedi.");
  return { id: data.id, url: data.url };
}
