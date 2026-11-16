-- Harden Data API surface without changing app access patterns.
-- Secret-gated SECURITY DEFINER RPCs are only for the service role (Next.js server).
-- Share/album tables stay server-only (RLS on, no client grants, no policies = deny).

revoke all on function public.dv_order_for_customer(text, text, text) from public, anon, authenticated;
revoke all on function public.dv_order_upsert(jsonb, text) from public, anon, authenticated;
revoke all on function public.dv_etsy_lookup(text, text) from public, anon, authenticated;
revoke all on function public.dv_etsy_redeem(text, text) from public, anon, authenticated;
revoke all on function public.dv_handle_new_user() from public, anon, authenticated;

-- Used inside RLS policies for signed-in admins; anon must not probe it via RPC.
revoke all on function public.dv_is_admin() from public, anon;
grant execute on function public.dv_is_admin() to authenticated;

-- Service role keeps EXECUTE (bypasses RLS; still needs function execute).
grant execute on function public.dv_order_for_customer(text, text, text) to service_role;
grant execute on function public.dv_order_upsert(jsonb, text) to service_role;
grant execute on function public.dv_etsy_lookup(text, text) to service_role;
grant execute on function public.dv_etsy_redeem(text, text) to service_role;

-- Default table privileges had left share_links wide open; RLS had no policies so
-- reads/writes already failed, but revoke anyway for defense in depth.
revoke all on table public.dv_share_links from public, anon, authenticated;
revoke all on table public.dv_album_photos from public, anon, authenticated;
