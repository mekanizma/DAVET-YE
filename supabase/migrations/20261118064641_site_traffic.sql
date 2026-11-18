-- First-party site traffic for the admin live visitor counter.
-- Server-only (service role). RLS on, no client grants.

create table if not exists public.dv_traffic_sessions (
  session_id text primary key check (char_length(session_id) between 8 and 64),
  visitor_key text not null check (char_length(visitor_key) between 8 and 64),
  path text not null default '/' check (char_length(path) between 1 and 240),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  day_key date not null default ((timezone('Europe/Istanbul', now()))::date),
  pageviews integer not null default 1 check (pageviews >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  engaged boolean not null default false,
  referrer text not null default '' check (char_length(referrer) <= 240),
  device text not null default 'other' check (device in ('mobile', 'desktop', 'other'))
);

create index if not exists dv_traffic_sessions_last_seen_idx
  on public.dv_traffic_sessions (last_seen desc);
create index if not exists dv_traffic_sessions_day_key_idx
  on public.dv_traffic_sessions (day_key desc);
create index if not exists dv_traffic_sessions_visitor_day_idx
  on public.dv_traffic_sessions (day_key, visitor_key);

create table if not exists public.dv_traffic_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (char_length(session_id) between 8 and 64),
  visitor_key text not null check (char_length(visitor_key) between 8 and 64),
  kind text not null check (kind in ('pageview', 'click', 'engage', 'ping')),
  path text not null check (char_length(path) between 1 and 240),
  label text not null default '' check (char_length(label) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists dv_traffic_events_created_idx
  on public.dv_traffic_events (created_at desc);
create index if not exists dv_traffic_events_kind_created_idx
  on public.dv_traffic_events (kind, created_at desc);
create index if not exists dv_traffic_events_path_created_idx
  on public.dv_traffic_events (path, created_at desc)
  where kind = 'pageview';

alter table public.dv_traffic_sessions enable row level security;
alter table public.dv_traffic_events enable row level security;
revoke all on table public.dv_traffic_sessions from public, anon, authenticated;
revoke all on table public.dv_traffic_events from public, anon, authenticated;
