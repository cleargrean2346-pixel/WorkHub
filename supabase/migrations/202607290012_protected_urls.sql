create table if not exists public.protected_urls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  original_url text not null check (original_url ~ '^https://'),
  protected_token text not null unique,
  enabled boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.protected_urls enable row level security;
create policy "admins read protected urls" on public.protected_urls for select to authenticated using (exists (select 1 from public.posts p where p.id = post_id and public.is_organization_admin(p.organization_id)));
create policy "admins create protected urls" on public.protected_urls for insert to authenticated with check (created_by = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.is_organization_admin(p.organization_id)));
create policy "admins update protected urls" on public.protected_urls for update to authenticated using (exists (select 1 from public.posts p where p.id = post_id and public.is_organization_admin(p.organization_id))) with check (exists (select 1 from public.posts p where p.id = post_id and public.is_organization_admin(p.organization_id)));
create policy "admins delete protected urls" on public.protected_urls for delete to authenticated using (exists (select 1 from public.posts p where p.id = post_id and public.is_organization_admin(p.organization_id)));

create or replace function public.resolve_protected_url(token text)
returns text language plpgsql security definer set search_path = public as $$
declare target_url text;
begin
  select u.original_url into target_url
  from public.protected_urls u
  join public.posts p on p.id = u.post_id
  where u.protected_token = token
    and u.enabled = true
    and public.is_organization_member(p.organization_id);
  if target_url is null then raise exception 'protected link unavailable'; end if;
  return target_url;
end;
$$;
grant execute on function public.resolve_protected_url(text) to authenticated;
