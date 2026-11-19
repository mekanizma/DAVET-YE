-- One Etsy code can unlock either a newspaper or an invitation (customer chooses).

alter table public.dv_etsy_codes
  drop constraint if exists dv_etsy_codes_product_kind_check;

alter table public.dv_etsy_codes
  add constraint dv_etsy_codes_product_kind_check
  check (product_kind in ('gazete', 'davetiye', 'any'));

update public.dv_etsy_codes
set product_kind = 'any'
where newspaper_slug = '__any__'
  and product_kind in ('gazete', 'davetiye');
