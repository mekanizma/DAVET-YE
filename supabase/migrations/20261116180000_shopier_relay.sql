-- Shopier calls leave Supabase, not the web host. Render's direct call is rejected.
create extension if not exists http;

create or replace function public.shopier_relay(method text, path text, payload jsonb, token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  res http_response;
  raw text;
begin
  if method is null or method not in ('GET', 'POST', 'DELETE') then
    return jsonb_build_object('status', 400, 'raw', 'method');
  end if;
  if path is null or path !~ '^/(products|orders|shop)([/?].*)?$' then
    return jsonb_build_object('status', 400, 'raw', 'path');
  end if;
  if token is null or length(token) < 20 or length(token) > 5000 then
    return jsonb_build_object('status', 400, 'raw', 'token');
  end if;
  select * into res
  from http((
    method,
    'https://api.shopier.com/v1' || path,
    array[
      http_header('Authorization', 'Bearer ' || token),
      http_header('Accept', 'application/json'),
      http_header('Content-Type', 'application/json')
    ],
    case when payload is null then null else 'application/json' end,
    case when payload is null then null else payload::text end
  )::http_request);
  raw := left(coalesce(res.content, ''), 12000);
  return jsonb_build_object('status', res.status, 'raw', raw);
end;
$$;

revoke all on function public.shopier_relay(text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.shopier_relay(text, text, jsonb, text) to service_role;
