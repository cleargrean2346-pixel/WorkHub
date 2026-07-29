do $$ begin
  create type public.work_request_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.work_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  status public.work_request_status not null default 'submitted',
  approver_id uuid references public.profiles(id),
  decision_note text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.work_requests enable row level security;
create policy "members read work requests" on public.work_requests for select to authenticated using (public.is_organization_member(organization_id));
create policy "members create work requests" on public.work_requests for insert to authenticated with check (requester_id = auth.uid() and public.is_organization_member(organization_id));
create policy "requesters edit active requests" on public.work_requests for update to authenticated using (requester_id = auth.uid() and status in ('draft', 'submitted')) with check (requester_id = auth.uid() and status in ('draft', 'submitted', 'cancelled'));
create policy "admins decide work requests" on public.work_requests for update to authenticated using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
