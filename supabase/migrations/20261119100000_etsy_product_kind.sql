-- Etsy codes can unlock one free newspaper OR one free invitation.

alter table public.dv_etsy_codes
  add column if not exists product_kind text not null default 'gazete';

alter table public.dv_etsy_codes
  drop constraint if exists dv_etsy_codes_product_kind_check;

alter table public.dv_etsy_codes
  add constraint dv_etsy_codes_product_kind_check
  check (product_kind in ('gazete', 'davetiye'));

create index if not exists dv_etsy_codes_kind_idx on public.dv_etsy_codes (product_kind);
