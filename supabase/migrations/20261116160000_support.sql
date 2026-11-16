-- Website support / contact requests from the floating form.
-- Server-only (service role). RLS on, no client grants.

create table if not exists public.dv_support (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) between 1 and 60),
  last_name text not null check (char_length(trim(last_name)) between 1 and 60),
  email text not null check (char_length(trim(email)) between 5 and 160),
  message text not null check (char_length(trim(message)) between 5 and 2000),
  source text not null default 'widget' check (source in ('widget', 'page')),
  status text not null default 'new' check (status in ('new', 'read', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists dv_support_created_idx on public.dv_support (created_at desc);
create index if not exists dv_support_status_idx on public.dv_support (status, created_at desc);

alter table public.dv_support enable row level security;
revoke all on table public.dv_support from public, anon, authenticated;
