create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  site_title text not null default 'WorkHub',
  site_description text not null default 'Workspace for teams',
  maintenance_enabled boolean not null default false,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.notices enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy "public read published notices" on public.notices for select to anon, authenticated using (status = 'published');
create policy "admins manage notices" on public.notices for all to authenticated using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "public read site settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admins update site settings" on public.site_settings for update to authenticated using (exists (select 1 from public.organization_members m where m.user_id = auth.uid() and m.status = 'approved' and m.role in ('organization_admin', 'system_admin'))) with check (exists (select 1 from public.organization_members m where m.user_id = auth.uid() and m.status = 'approved' and m.role in ('organization_admin', 'system_admin')));
create policy "admins read audit logs" on public.audit_logs for select to authenticated using (public.is_organization_admin(organization_id));

create or replace function public.record_audit_log(target_organization_id uuid, event_action text, event_target_type text default null, event_target_id text default null, event_details jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare log_id uuid;
begin
  if not public.is_organization_member(target_organization_id) then raise exception 'not an organization member'; end if;
  insert into public.audit_logs (organization_id, actor_id, action, target_type, target_id, details)
  values (target_organization_id, auth.uid(), event_action, event_target_type, event_target_id, event_details)
  returning id into log_id;
  return log_id;
end;
$$;
grant execute on function public.record_audit_log(uuid, text, text, text, jsonb) to authenticated;
