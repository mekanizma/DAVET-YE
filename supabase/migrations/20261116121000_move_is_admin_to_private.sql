-- Keep admin checks for RLS, but hide the helper from PostgREST /rpc.

create or replace function dv_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.dv_profiles
    where id = auth.uid() and role = 'admin'
  );
$fn$;

revoke all on function dv_private.is_admin() from public, anon, authenticated;
grant execute on function dv_private.is_admin() to authenticated, service_role;

drop policy if exists settings_admin_update on public.dv_payment_settings;
create policy settings_admin_update on public.dv_payment_settings
  for update to authenticated
  using ((select dv_private.is_admin()))
  with check ((select dv_private.is_admin()));

drop policy if exists site_admin_update on public.dv_site_config;
create policy site_admin_update on public.dv_site_config
  for update to authenticated
  using ((select dv_private.is_admin()))
  with check ((select dv_private.is_admin()));

drop policy if exists theme_admin_write on public.dv_theme_overrides;
create policy theme_admin_write on public.dv_theme_overrides
  for all to authenticated
  using ((select dv_private.is_admin()))
  with check ((select dv_private.is_admin()));

drop policy if exists paper_admin_write on public.dv_paper_overrides;
create policy paper_admin_write on public.dv_paper_overrides
  for all to authenticated
  using ((select dv_private.is_admin()))
  with check ((select dv_private.is_admin()));

drop policy if exists addon_admin_write on public.dv_addon_overrides;
create policy addon_admin_write on public.dv_addon_overrides
  for all to authenticated
  using ((select dv_private.is_admin()))
  with check ((select dv_private.is_admin()));

drop policy if exists orders_admin_all on public.dv_orders;
create policy orders_admin_all on public.dv_orders
  for all to authenticated
  using ((select dv_private.is_admin()))
  with check ((select dv_private.is_admin()));

drop policy if exists etsy_admin_all on public.dv_etsy_codes;
create policy etsy_admin_all on public.dv_etsy_codes
  for all to authenticated
  using ((select dv_private.is_admin()))
  with check ((select dv_private.is_admin()));

drop function if exists public.dv_is_admin();
