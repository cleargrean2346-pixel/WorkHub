-- Private organization document storage and document metadata.
insert into storage.buckets (id, name, public, file_size_limit)
values ('workhub-files', 'workhub-files', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  storage_path text not null unique,
  content_type text,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "members read documents" on public.documents for select to authenticated
using (public.is_organization_member(organization_id));
create policy "members upload documents" on public.documents for insert to authenticated
with check (uploader_id = auth.uid() and public.is_organization_member(organization_id));
create policy "owners and admins delete documents" on public.documents for delete to authenticated
using (uploader_id = auth.uid() or public.is_organization_admin(organization_id));

create policy "members read workhub files" on storage.objects for select to authenticated
using (bucket_id = 'workhub-files' and public.is_organization_member((storage.foldername(name))[1]::uuid));
create policy "members upload workhub files" on storage.objects for insert to authenticated
with check (bucket_id = 'workhub-files' and public.is_organization_member((storage.foldername(name))[1]::uuid));
create policy "owners and admins delete workhub files" on storage.objects for delete to authenticated
using (bucket_id = 'workhub-files' and (owner_id = auth.uid() or public.is_organization_admin((storage.foldername(name))[1]::uuid)));
