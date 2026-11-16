export type ShareRsvp = {
  id: string;
  name: string;
  attending: boolean;
  count: number;
  children: number;
  meal: string;
  transfer: string;
  note: string;
  createdAt?: string;
};

export async function postShareRsvp(
  slug: string,
  body: {
    name: string;
    attending: boolean;
    count?: number;
    children?: number;
    meal?: string;
    transfer?: string;
    note?: string;
  },
): Promise<ShareRsvp> {
  const res = await fetch(`/api/d/${encodeURIComponent(slug)}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as ShareRsvp & { error?: string };
  if (!res.ok || !data.id) throw new Error(data.error || "Yanıt kaydedilemedi.");
  return data;
}
