-- Guest photos from the memory wall and memory shots.
-- The bucket is private. Only the server (service role) reads and writes it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'album',
  'album',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.dv_album_photos (
  id uuid primary key default gen_random_uuid(),
  order_code text not null references public.dv_orders (code) on delete cascade,
  user_id uuid,
  slug text not null,
  source text not null check (source in ('wall', 'lens')),
  ext text not null check (ext in ('jpg', 'png', 'webp')),
  bytes int not null check (bytes > 0 and bytes <= 8388608),
  created_at timestamptz not null default now()
);

create index if not exists dv_album_order_idx on public.dv_album_photos (order_code, created_at desc);
create index if not exists dv_album_slug_idx on public.dv_album_photos (slug, created_at);
create index if not exists dv_album_user_idx on public.dv_album_photos (user_id, created_at desc);

alter table public.dv_album_photos enable row level security;
revoke all on table public.dv_album_photos from public, anon, authenticated;
