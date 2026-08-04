create table if not exists public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null check (request_type in ('delete','anonymize')), reason text not null default '',
  status text not null default 'requested' check (status in ('requested','reviewing','completed','rejected')),
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.data_deletion_requests enable row level security;
create policy "users create own data deletion requests" on public.data_deletion_requests for insert to authenticated with check (user_id = auth.uid());
create policy "users read own data deletion requests" on public.data_deletion_requests for select to authenticated using (user_id = auth.uid());
create policy "admins manage data deletion requests" on public.data_deletion_requests for all to authenticated using (exists(select 1 from public.organization_members m where m.user_id=auth.uid() and m.status='approved' and m.role in ('organization_admin','system_admin'))) with check (exists(select 1 from public.organization_members m where m.user_id=auth.uid() and m.status='approved' and m.role in ('organization_admin','system_admin')));
