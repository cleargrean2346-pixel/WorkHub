drop policy if exists "members read published banners" on public.banners;
drop policy if exists "admins create banners" on public.banners;
drop policy if exists "admins update banners" on public.banners;
drop policy if exists "admins delete banners" on public.banners;
create policy "members read published banners" on public.banners for select to authenticated using (public.is_organization_member(organization_id));
create policy "admins create banners" on public.banners for insert to authenticated with check (creator_id=auth.uid() and public.is_organization_admin(organization_id));
create policy "admins update banners" on public.banners for update to authenticated using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "admins delete banners" on public.banners for delete to authenticated using (public.is_organization_admin(organization_id));
