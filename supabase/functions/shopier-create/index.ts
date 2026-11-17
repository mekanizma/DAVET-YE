import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

function db(key?: string) {
  const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") || "";
  const service = key || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function authorized(req: Request, serviceClient: NonNullable<ReturnType<typeof db>>): Promise<boolean> {
  const given = (req.headers.get("x-shopier-create-secret") || "").trim();
  const { data: authRow } = await serviceClient.rpc("shopier_edge_auth", { given_secret: given });
  if (authRow && (authRow as { ok?: boolean }).ok === true) return true;

  // Render may use a different SUPABASE_SERVER_SECRET than the DB copy.
  // Accept the caller's service-role bearer instead.
  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer) return false;
  const asCaller = db(bearer);
  if (!asCaller) return false;
  const { data: ping, error } = await asCaller.rpc("shopier_service_ping");
  return !error && Boolean(ping && (ping as { ok?: boolean }).ok === true);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const client = db();
  if (!client) return json({ error: "db" }, 503);
  if (!(await authorized(req, client))) return json({ error: "auth" }, 401);

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "body" }, 400);
  }

  if (body.action === "delete") {
    const productId = String(body.productId || "").trim();
    if (!/^\d+$/.test(productId)) return json({ error: "product" }, 400);
    const { data, error } = await client.rpc("shopier_relay_delete", { product_id: productId });
    if (error || !(data as { ok?: boolean } | null)?.ok) {
      console.error("shopier delete failed", error?.message || data);
      return json({ error: "shopier" }, 502);
    }
    return json({ ok: true });
  }

  const code = String(body.code || "").trim().toUpperCase();
  const kind = body.kind === "gazete" ? "gazete" : "davetiye";
  const total = Number(body.total);
  const previousProductId = String(body.previousProductId || "").trim();
  const imageUrl = String(body.imageUrl || "").trim() || "https://davetanisi.com/og.jpg";

  const { data, error } = await client.rpc("shopier_create_product", {
    order_code: code,
    kind,
    total,
    image_url: imageUrl,
    previous_product_id: previousProductId || null,
  });
  if (error) {
    console.error("shopier_create_product error", error.message);
    return json({ error: "shopier", detail: error.message }, 502);
  }
  const row = (data || {}) as { ok?: boolean; productId?: string; productUrl?: string; error?: string; status?: number };
  const productId = String(row.productId || "");
  if (!row.ok || !/^\d+$/.test(productId)) {
    console.error("shopier_create_product failed", row);
    return json({ error: "shopier", status: row.status || 0, detail: row.error || "" }, 502);
  }

  return json({
    productId,
    productUrl: row.productUrl || `https://www.shopier.com/${productId}`,
  });
});
