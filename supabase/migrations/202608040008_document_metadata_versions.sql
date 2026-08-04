create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_no integer not null,
  title text not null,
  folder_id uuid references public.document_folders(id) on delete set null,
  description text,
  changed_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(document_id, version_no)
);
alter table public.document_versions enable row level security;
drop policy if exists "members read document versions" on public.document_versions;
create policy "members read document versions" on public.document_versions for select to authenticated using (public.is_organization_member(organization_id));
drop policy if exists "members create document versions" on public.document_versions;
create policy "members create document versions" on public.document_versions for insert to authenticated with check (changed_by = auth.uid() and public.is_organization_member(organization_id));
