-- Etsy access codes: sold on Etsy, redeemed to unlock newspaper design + download.

create table if not exists public.dv_etsy_codes (
  code text primary key,
  newspaper_slug text not null,
  newspaper_title text not null default '',
  note text not null default '',
  status text not null default 'active' check (status in ('active', 'redeemed', 'revoked')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  last_used_at timestamptz,
  use_count int not null default 0 check (use_count >= 0)
);

create index if not exists dv_etsy_codes_created_idx on public.dv_etsy_codes (created_at desc);
create index if not exists dv_etsy_codes_slug_idx on public.dv_etsy_codes (newspaper_slug);
create index if not exists dv_etsy_codes_status_idx on public.dv_etsy_codes (status);

alter table public.dv_etsy_codes enable row level security;

revoke all on table public.dv_etsy_codes from anon, authenticated, public;
grant select, insert, update, delete on table public.dv_etsy_codes to authenticated;

drop policy if exists etsy_admin_all on public.dv_etsy_codes;
create policy etsy_admin_all on public.dv_etsy_codes
  for all to authenticated
  using ((select public.dv_is_admin()))
  with check ((select public.dv_is_admin()));

create or replace function public.dv_etsy_redeem(access_code text, server_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public, dv_private
as $fn$
declare
  result jsonb;
  clean_code text;
begin
  perform dv_private.require_secret(server_secret);
  clean_code := upper(trim(coalesce(access_code, '')));
  if clean_code !~ '^ETSY-[A-Z0-9]{6,16}$' then
    return null;
  end if;

  update public.dv_etsy_codes
  set
    status = case when status = 'active' then 'redeemed' else status end,
    redeemed_at = coalesce(redeemed_at, now()),
    last_used_at = now(),
    use_count = use_count + 1
  where code = clean_code
    and status in ('active', 'redeemed')
  returning to_jsonb(public.dv_etsy_codes.*) into result;

  return result;
end;
$fn$;

create or replace function public.dv_etsy_lookup(access_code text, server_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public, dv_private
as $fn$
declare
  result jsonb;
  clean_code text;
begin
  perform dv_private.require_secret(server_secret);
  clean_code := upper(trim(coalesce(access_code, '')));
  if clean_code !~ '^ETSY-[A-Z0-9]{6,16}$' then
    return null;
  end if;
  select to_jsonb(c) into result
  from public.dv_etsy_codes c
  where c.code = clean_code
    and c.status in ('active', 'redeemed');
  return result;
end;
$fn$;

revoke all on function public.dv_etsy_redeem(text, text) from public;
revoke all on function public.dv_etsy_lookup(text, text) from public;
grant execute on function public.dv_etsy_redeem(text, text) to anon, authenticated;
grant execute on function public.dv_etsy_lookup(text, text) to anon, authenticated;
