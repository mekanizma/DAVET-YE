-- All live public share links stay open for 6 months from go-live.
update public.dv_share_links
set expires_at = (coalesce(live_at, created_at) + interval '6 months')
where status = 'live'
  and expires_at < (coalesce(live_at, created_at) + interval '6 months');
