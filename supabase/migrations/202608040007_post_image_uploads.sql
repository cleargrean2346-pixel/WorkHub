-- Public images are only used by posts. Uploads remain restricted to approved
-- organization members through the organization UUID at the start of the path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "members upload post images" on storage.objects;
create policy "members upload post images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'post-images'
  and public.is_organization_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "members delete own post images" on storage.objects;
create policy "members delete own post images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'post-images'
  and (owner_id = auth.uid()::text or public.is_organization_admin((storage.foldername(name))[1]::uuid))
);
