export type ShareWish = {
  id: string;
  name: string;
  text: string;
  createdAt?: string;
};

export async function listShareWishes(slug: string): Promise<ShareWish[]> {
  const res = await fetch(`/api/d/${encodeURIComponent(slug)}/dilek`, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { wishes?: ShareWish[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Dilekler okunamadı.");
  return Array.isArray(data.wishes) ? data.wishes.filter((row) => row?.id && row?.name && row?.text) : [];
}

export async function postShareWish(slug: string, name: string, text: string): Promise<ShareWish> {
  const res = await fetch(`/api/d/${encodeURIComponent(slug)}/dilek`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, text }),
  });
  const data = (await res.json().catch(() => ({}))) as ShareWish & { error?: string };
  if (!res.ok || !data.id || !data.name || !data.text) throw new Error(data.error || "Dilek kaydedilemedi.");
  return { id: data.id, name: data.name, text: data.text, createdAt: data.createdAt };
}
