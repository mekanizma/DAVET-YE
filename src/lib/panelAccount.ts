import { sharesForOrders } from "@/lib/shareLink";
import type { SharePublic } from "@/lib/shareSlug";
import { toOrder, type DbOrder } from "@/lib/orderRow";
import type { OrderRecord } from "@/lib/orderTypes";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface PanelAccount {
  email: string;
  name: string;
  orders: OrderRecord[];
  shares: Record<string, SharePublic>;
}

const ORDER_COLUMNS = "code,status,kind,template,title,total,lines,created_at,updated_at,reported_at,decided_at,sender_name,customer_note,admin_note,customer_name,customer_email,customer_phone,snapshot";

/** Account for the panel. The middleware already checked the session, so this does not call the auth server again. */
export async function loadPanelAccount(): Promise<PanelAccount | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user?.email) return null;
  const { data, error } = await supabase
    .from("dv_orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return null;
  const orders = ((data || []) as unknown as DbOrder[]).map(toOrder);
  const shares = await sharesForOrders(orders.map((order) => order.code));
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  return { email: user.email, name, orders, shares };
}
