-- Guest RSVP replies from the live invitation form.
-- Server-only (service role). RLS on, no client grants.

create table if not exists public.dv_rsvp (
  id uuid primary key default gen_random_uuid(),
  order_code text not null references public.dv_orders (code) on delete cascade,
  user_id uuid,
  slug text not null,
  guest_name text not null check (char_length(trim(guest_name)) between 2 and 80),
  attending boolean not null,
  guest_count int not null default 0 check (guest_count >= 0 and guest_count <= 20),
  children_count int not null default 0 check (children_count >= 0 and children_count <= 20),
  meal text not null default '' check (char_length(meal) <= 80),
  transfer text not null default '' check (char_length(transfer) <= 80),
  note text not null default '' check (char_length(note) <= 400),
  created_at timestamptz not null default now()
);

create index if not exists dv_rsvp_order_idx on public.dv_rsvp (order_code, created_at desc);
create index if not exists dv_rsvp_slug_idx on public.dv_rsvp (slug, created_at);

alter table public.dv_rsvp enable row level security;
revoke all on table public.dv_rsvp from public, anon, authenticated;
