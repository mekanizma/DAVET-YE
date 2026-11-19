-- Support notifications are sent by the send-support-mail edge function,
-- on the same Supabase side as auth (verify / password reset) mail.
-- SMTP credentials live in dv_private.mail_settings and are not stored here.

alter table public.dv_support
  add column if not exists mail_sent_at timestamptz;

create table if not exists dv_private.mail_settings (
  id int primary key check (id = 1),
  smtp_host text not null,
  smtp_port int not null default 465,
  smtp_user text not null,
  smtp_pass text not null,
  smtp_from text not null,
  smtp_from_name text not null default 'Davetanisi',
  notify_emails text not null default 'info@mekanizma.com'
);

revoke all on table dv_private.mail_settings from public, anon, authenticated;

create or replace function public.dv_mail_smtp(given_secret text)
returns jsonb
language plpgsql
security definer
set search_path = dv_private, public
as $fn$
declare
  expected text;
  row dv_private.mail_settings%rowtype;
begin
  select secret into expected from dv_private.server_secret where id = 1;
  if expected is null or given_secret is null or given_secret = '' or given_secret <> expected then
    return null;
  end if;
  select * into row from dv_private.mail_settings where id = 1;
  if row.id is null then
    return null;
  end if;
  return jsonb_build_object(
    'host', row.smtp_host,
    'port', row.smtp_port,
    'user', row.smtp_user,
    'pass', row.smtp_pass,
    'from', row.smtp_from,
    'from_name', row.smtp_from_name,
    'notify', row.notify_emails
  );
end;
$fn$;

revoke all on function public.dv_mail_smtp(text) from public, anon, authenticated;
grant execute on function public.dv_mail_smtp(text) to service_role;

create extension if not exists pg_net with schema extensions;

create or replace function dv_private.enqueue_support_mail()
returns trigger
language plpgsql
security definer
set search_path = dv_private, net, public
as $fn$
declare
  secret text;
begin
  select s.secret into secret from dv_private.server_secret s where s.id = 1;
  if secret is null or secret = '' then
    return NEW;
  end if;
  perform net.http_post(
    url := 'https://mpsfwjdoykijxkzeazfq.supabase.co/functions/v1/send-support-mail',
    body := jsonb_build_object('secret', secret, 'id', NEW.id),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 20000
  );
  return NEW;
exception
  when others then
    raise warning 'support mail enqueue failed: %', sqlerrm;
    return NEW;
end;
$fn$;

revoke all on function dv_private.enqueue_support_mail() from public, anon, authenticated;

drop trigger if exists dv_support_mail on public.dv_support;
create trigger dv_support_mail
  after insert on public.dv_support
  for each row execute function dv_private.enqueue_support_mail();
