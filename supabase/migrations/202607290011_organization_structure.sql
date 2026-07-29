create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

alter table public.organization_members add column if not exists team_id uuid references public.teams(id) on delete set null;

alter table public.departments enable row level security;
alter table public.teams enable row level security;
create policy "members read departments" on public.departments for select to authenticated using (public.is_organization_member(organization_id));
create policy "admins manage departments" on public.departments for all to authenticated using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "members read teams" on public.teams for select to authenticated using (public.is_organization_member(organization_id));
create policy "admins manage teams" on public.teams for all to authenticated using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
