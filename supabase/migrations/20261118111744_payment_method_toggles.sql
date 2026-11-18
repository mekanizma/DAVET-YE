-- Admin can turn Shopier and IBAN checkout on or off independently.
alter table public.dv_payment_settings
  add column if not exists shopier_enabled boolean not null default true,
  add column if not exists iban_enabled boolean not null default false;
