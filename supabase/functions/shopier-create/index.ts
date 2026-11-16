import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SHOPIER_API = "https://api.shopier.com/v1";

type Body = {
  action?: string;
  productId?: string;
  code?: string;
  kind?: "davetiye" | "gazete";
  total?: number;
  previousProductId?: string;
  imageUrl?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function shopier(pat: string, path: string, init?: { method?: string; body?: unknown }) {
  const res = await fetch(`${SHOPIER_API}${path}`, {
    method: init?.method || "GET",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const raw = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    data = null;
  }
  return { status: res.status, data, raw };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const expected = (Deno.env.get("SHOPIER_CREATE_SECRET") || Deno.env.get("SUPABASE_SERVER_SECRET") || "").trim();
  const given = (req.headers.get("x-shopier-create-secret") || "").trim();
  if (!expected || given !== expected) return json({ error: "auth" }, 401);

  const pat = (Deno.env.get("SHOPIER_PAT") || "").trim();
  if (!pat) return json({ error: "pat" }, 503);

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "body" }, 400);
  }

  if (body.action === "delete") {
    const productId = String(body.productId || "").trim();
    if (!/^\d+$/.test(productId)) return json({ error: "product" }, 400);
    const removed = await shopier(pat, `/products/${productId}`, { method: "DELETE" });
    if (removed.status !== 200 && removed.status !== 204 && removed.status !== 404) {
      console.error("shopier delete failed", removed.status, removed.raw.slice(0, 400));
      return json({ error: "shopier", status: removed.status }, 502);
    }
    return json({ ok: true });
  }

  const code = String(body.code || "").trim().toUpperCase();
  const kind = body.kind === "gazete" ? "gazete" : "davetiye";
  const total = Number(body.total);
  const previousProductId = String(body.previousProductId || "").trim();
  const imageUrl = String(body.imageUrl || "").trim() || "https://davetanisi.com/og.jpg";

  if (!/^DV-[A-Z0-9]{4,24}$/.test(code)) return json({ error: "code" }, 400);
  if (!Number.isInteger(total) || total <= 0) return json({ error: "total" }, 400);
  if (!/^https:\/\//i.test(imageUrl)) return json({ error: "image" }, 400);

  const label = kind === "gazete" ? "Dijital gazete" : "Dijital davetiye";
  const created = await shopier(pat, "/products", {
    method: "POST",
    body: {
      title: `${label} ${code}`.slice(0, 100),
      description: `Tek kullanımlık dijital sipariş ${code}.`,
      type: "digital",
      shippingPayer: "sellerPays",
      priceData: { currency: "TRY", price: total.toFixed(2) },
      stockQuantity: 1,
      customListing: true,
      media: [{ type: "image", url: imageUrl, placement: 1 }],
    },
  });

  const productId = String(created.data?.id || "");
  if (created.status < 200 || created.status >= 300 || !/^\d+$/.test(productId)) {
    console.error("shopier create failed", created.status, created.raw.slice(0, 400));
    return json({ error: "shopier", status: created.status }, 502);
  }

  if (previousProductId && /^\d+$/.test(previousProductId) && previousProductId !== productId) {
    try {
      await shopier(pat, `/products/${previousProductId}`, { method: "DELETE" });
    } catch (error) {
      console.error(error);
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
  if (supabaseUrl && serviceKey) {
    try {
      const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data: row } = await db.from("dv_orders").select("snapshot").eq("code", code).maybeSingle();
      const snapshot = { ...((row?.snapshot as Record<string, string> | null) || {}), __shopier: productId, __shopierAmount: String(total) };
      await db.from("dv_orders").update({ snapshot, updated_at: new Date().toISOString() }).eq("code", code);
    } catch (error) {
      console.error(error);
    }
  }

  return json({
    productId,
    productUrl: `https://www.shopier.com/${productId}`,
  });
});
