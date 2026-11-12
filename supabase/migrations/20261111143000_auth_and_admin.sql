-- Customer accounts, admin role, and the data behind the admin panel.
-- Orders are written only by server functions that check a private secret.
-- Catalog rows are public (prices and the transfer account already show on the site).

create schema if not exists dv_private;
revoke all on schema dv_private from public, anon, authenticated;

create table if not exists dv_private.server_secret (
  id int primary key check (id = 1),
  secret text not null
);
revoke all on table dv_private.server_secret from public, anon, authenticated;

create table if not exists public.dv_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.dv_payment_settings (
  id int primary key check (id = 1),
  bank_name text not null default '',
  account_holder text not null default '',
  iban text not null default '',
  instructions text not null default '',
  support_email text not null default '',
  support_phone text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.dv_site_config (
  id int primary key check (id = 1),
  studio_price int,
  features text[],
  updated_at timestamptz not null default now()
);

create table if not exists public.dv_theme_overrides (
  slug text primary key,
  price int,
  compare_at int,
  featured boolean,
  hidden boolean,
  badge text
);

create table if not exists public.dv_paper_overrides (
  slug text primary key,
  price int,
  compare_at int,
  hidden boolean
);

create table if not exists public.dv_addon_overrides (
  id text primary key,
  title text,
  note text,
  blurb text,
  price int,
  was int,
  was_set boolean not null default false,
  active boolean,
  included boolean
);

create table if not exists public.dv_orders (
  code text primary key,
  status text not null check (status in ('bekliyor', 'bildirildi', 'onaylandi', 'reddedildi')),
  kind text not null check (kind in ('davetiye', 'gazete')),
  template text not null,
  title text not null,
  total int not null check (total >= 0 and total <= 5000000),
  lines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reported_at timestamptz,
  decided_at timestamptz,
  sender_name text not null default '',
  customer_note text not null default '',
  admin_note text not null default '',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  snapshot jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users (id) on delete set null
);

create index if not exists dv_orders_created_idx on public.dv_orders (created_at desc);
create index if not exists dv_orders_user_idx on public.dv_orders (user_id);
create index if not exists dv_orders_email_idx on public.dv_orders (lower(customer_email));

insert into public.dv_payment_settings (id) values (1) on conflict (id) do nothing;
insert into public.dv_site_config (id) values (1) on conflict (id) do nothing;

alter table public.dv_profiles enable row level security;
alter table public.dv_payment_settings enable row level security;
alter table public.dv_site_config enable row level security;
alter table public.dv_theme_overrides enable row level security;
alter table public.dv_paper_overrides enable row level security;
alter table public.dv_addon_overrides enable row level security;
alter table public.dv_orders enable row level security;

create or replace function public.dv_is_admin()
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

create or replace function public.dv_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.dv_profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when new.raw_app_meta_data->>'role' = 'admin' then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists dv_on_auth_user_created on auth.users;
create trigger dv_on_auth_user_created
  after insert on auth.users
  for each row execute function public.dv_handle_new_user();

create or replace function dv_private.require_secret(given text)
returns void
language plpgsql
security definer
set search_path = dv_private
as $fn$
declare
  expected text;
begin
  select secret into expected from dv_private.server_secret where id = 1;
  if expected is null or given is null or given = '' or given <> expected then
    raise exception 'forbidden';
  end if;
end;
$fn$;

revoke all on function dv_private.require_secret(text) from public, anon, authenticated;

create or replace function public.dv_order_for_customer(order_code text, email text, server_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public, dv_private
as $fn$
declare
  result jsonb;
begin
  perform dv_private.require_secret(server_secret);
  select to_jsonb(o) into result
  from public.dv_orders o
  where o.code = upper(trim(coalesce(order_code, '')))
    and lower(o.customer_email) = lower(trim(coalesce(email, '')));
  return result;
end;
$fn$;

create or replace function public.dv_order_upsert(payload jsonb, server_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public, dv_private
as $fn$
declare
  result jsonb;
  order_code text;
begin
  perform dv_private.require_secret(server_secret);
  order_code := upper(trim(coalesce(payload->>'code', '')));
  if order_code !~ '^DV-[A-Z0-9]{4,24}$' then
    raise exception 'code';
  end if;
  if payload->>'status' not in ('bekliyor', 'bildirildi', 'onaylandi', 'reddedildi') then
    raise exception 'status';
  end if;
  if payload->>'kind' not in ('davetiye', 'gazete') then
    raise exception 'kind';
  end if;

  insert into public.dv_orders (
    code, status, kind, template, title, total, lines,
    created_at, updated_at, reported_at, decided_at,
    sender_name, customer_note, admin_note,
    customer_name, customer_email, customer_phone, snapshot, user_id
  ) values (
    order_code,
    payload->>'status',
    payload->>'kind',
    left(coalesce(payload->>'template', ''), 80),
    left(coalesce(payload->>'title', ''), 160),
    least(5000000, greatest(0, coalesce((payload->>'total')::int, 0))),
    case when jsonb_typeof(payload->'lines') = 'array' then payload->'lines' else '[]'::jsonb end,
    coalesce((payload->>'createdAt')::timestamptz, now()),
    coalesce((payload->>'updatedAt')::timestamptz, now()),
    nullif(payload->>'reportedAt', '')::timestamptz,
    nullif(payload->>'decidedAt', '')::timestamptz,
    left(coalesce(payload->>'senderName', ''), 80),
    left(coalesce(payload->>'customerNote', ''), 500),
    left(coalesce(payload->>'adminNote', ''), 500),
    left(coalesce(payload->'customer'->>'name', ''), 80),
    left(lower(coalesce(payload->'customer'->>'email', '')), 120),
    left(coalesce(payload->'customer'->>'phone', ''), 20),
    case when jsonb_typeof(payload->'snapshot') = 'object' then payload->'snapshot' else '{}'::jsonb end,
    nullif(payload->>'userId', '')::uuid
  )
  on conflict (code) do update set
    status = excluded.status,
    kind = excluded.kind,
    template = excluded.template,
    title = excluded.title,
    total = excluded.total,
    lines = excluded.lines,
    updated_at = excluded.updated_at,
    reported_at = excluded.reported_at,
    decided_at = excluded.decided_at,
    sender_name = excluded.sender_name,
    customer_note = excluded.customer_note,
    admin_note = excluded.admin_note,
    customer_name = excluded.customer_name,
    customer_email = excluded.customer_email,
    customer_phone = excluded.customer_phone,
    snapshot = excluded.snapshot,
    user_id = coalesce(excluded.user_id, public.dv_orders.user_id);

  select to_jsonb(o) into result from public.dv_orders o where o.code = order_code;
  return result;
end;
$fn$;

revoke all on function public.dv_is_admin() from public;
revoke all on function public.dv_order_for_customer(text, text, text) from public;
revoke all on function public.dv_order_upsert(jsonb, text) from public;
grant execute on function public.dv_is_admin() to anon, authenticated;
grant execute on function public.dv_order_for_customer(text, text, text) to anon, authenticated;
grant execute on function public.dv_order_upsert(jsonb, text) to anon, authenticated;

revoke all on table public.dv_profiles from anon, authenticated, public;
grant select on table public.dv_profiles to authenticated;

revoke all on table public.dv_payment_settings from anon, authenticated, public;
grant select on table public.dv_payment_settings to anon, authenticated;
grant update on table public.dv_payment_settings to authenticated;

revoke all on table public.dv_site_config from anon, authenticated, public;
grant select on table public.dv_site_config to anon, authenticated;
grant update on table public.dv_site_config to authenticated;

revoke all on table public.dv_theme_overrides from anon, authenticated, public;
grant select on table public.dv_theme_overrides to anon, authenticated;
grant insert, update, delete on table public.dv_theme_overrides to authenticated;

revoke all on table public.dv_paper_overrides from anon, authenticated, public;
grant select on table public.dv_paper_overrides to anon, authenticated;
grant insert, update, delete on table public.dv_paper_overrides to authenticated;

revoke all on table public.dv_addon_overrides from anon, authenticated, public;
grant select on table public.dv_addon_overrides to anon, authenticated;
grant insert, update, delete on table public.dv_addon_overrides to authenticated;

revoke all on table public.dv_orders from anon, authenticated, public;
grant select, insert, update, delete on table public.dv_orders to authenticated;

drop policy if exists profiles_select_own on public.dv_profiles;
create policy profiles_select_own on public.dv_profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists settings_read on public.dv_payment_settings;
create policy settings_read on public.dv_payment_settings
  for select to anon, authenticated
  using (true);

drop policy if exists settings_admin_update on public.dv_payment_settings;
create policy settings_admin_update on public.dv_payment_settings
  for update to authenticated
  using ((select public.dv_is_admin()))
  with check ((select public.dv_is_admin()));

drop policy if exists site_read on public.dv_site_config;
create policy site_read on public.dv_site_config
  for select to anon, authenticated
  using (true);

drop policy if exists site_admin_update on public.dv_site_config;
create policy site_admin_update on public.dv_site_config
  for update to authenticated
  using ((select public.dv_is_admin()))
  with check ((select public.dv_is_admin()));

drop policy if exists theme_read on public.dv_theme_overrides;
create policy theme_read on public.dv_theme_overrides
  for select to anon, authenticated
  using (true);

drop policy if exists theme_admin_write on public.dv_theme_overrides;
create policy theme_admin_write on public.dv_theme_overrides
  for all to authenticated
  using ((select public.dv_is_admin()))
  with check ((select public.dv_is_admin()));

drop policy if exists paper_read on public.dv_paper_overrides;
create policy paper_read on public.dv_paper_overrides
  for select to anon, authenticated
  using (true);

drop policy if exists paper_admin_write on public.dv_paper_overrides;
create policy paper_admin_write on public.dv_paper_overrides
  for all to authenticated
  using ((select public.dv_is_admin()))
  with check ((select public.dv_is_admin()));

drop policy if exists addon_read on public.dv_addon_overrides;
create policy addon_read on public.dv_addon_overrides
  for select to anon, authenticated
  using (true);

drop policy if exists addon_admin_write on public.dv_addon_overrides;
create policy addon_admin_write on public.dv_addon_overrides
  for all to authenticated
  using ((select public.dv_is_admin()))
  with check ((select public.dv_is_admin()));

drop policy if exists orders_admin_all on public.dv_orders;
create policy orders_admin_all on public.dv_orders
  for all to authenticated
  using ((select public.dv_is_admin()))
  with check ((select public.dv_is_admin()));

drop policy if exists orders_own_select on public.dv_orders;
create policy orders_own_select on public.dv_orders
  for select to authenticated
  using (
    user_id = auth.uid()
    or lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
