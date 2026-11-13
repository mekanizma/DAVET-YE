-- A bought invitation keeps its public path for 3 months.
-- A bought newspaper keeps its public path for 6 months.
-- Guests read the page through the server; the table itself is not public.

create table if not exists public.dv_share_links (
  slug text primary key check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  order_code text not null unique,
  kind text not null check (kind in ('davetiye', 'gazete')),
  template text not null,
  locale text not null default 'tr' check (locale in ('tr', 'en')),
  email text not null default '',
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('reserved', 'live')),
  created_at timestamptz not null default now(),
  live_at timestamptz,
  expires_at timestamptz not null
);

create index if not exists dv_share_links_expires_idx on public.dv_share_links (expires_at);

alter table public.dv_share_links enable row level security;
