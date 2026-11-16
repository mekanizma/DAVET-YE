-- Guest wishes from the live invitation wish wall.
-- Server-only (service role). RLS on, no client grants.

create table if not exists public.dv_wishes (
  id uuid primary key default gen_random_uuid(),
  order_code text not null references public.dv_orders (code) on delete cascade,
  user_id uuid,
  slug text not null,
  guest_name text not null check (char_length(trim(guest_name)) between 2 and 80),
  body text not null check (char_length(trim(body)) between 3 and 300),
  created_at timestamptz not null default now()
);

create index if not exists dv_wishes_order_idx on public.dv_wishes (order_code, created_at desc);
create index if not exists dv_wishes_slug_idx on public.dv_wishes (slug, created_at);

alter table public.dv_wishes enable row level security;
revoke all on table public.dv_wishes from public, anon, authenticated;
