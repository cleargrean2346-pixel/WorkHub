-- Avoid recursive RLS evaluation when policies need to check organization membership.
create or replace function public.is_organization_member(target_organization_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where organization_id = target_organization_id and user_id = auth.uid());
$$;
grant execute on function public.is_organization_member(uuid) to authenticated;

drop policy "members read their organizations" on public.organizations;
drop policy "members read organization memberships" on public.organization_members;
drop policy "members read organization posts" on public.posts;
drop policy "authors create posts in their organizations" on public.posts;
drop policy "members read comments" on public.comments;
drop policy "members create comments" on public.comments;
drop policy "members read tasks" on public.work_tasks;
drop policy "members create tasks" on public.work_tasks;

create policy "members read their organizations" on public.organizations for select to authenticated using (public.is_organization_member(id));
create policy "members read organization memberships" on public.organization_members for select to authenticated using (public.is_organization_member(organization_id));
create policy "members read organization posts" on public.posts for select to authenticated using (public.is_organization_member(organization_id));
create policy "authors create posts in their organizations" on public.posts for insert to authenticated with check (author_id = auth.uid() and public.is_organization_member(organization_id));
create policy "members read comments" on public.comments for select to authenticated using (exists (select 1 from public.posts p where p.id = comments.post_id and public.is_organization_member(p.organization_id)));
create policy "members create comments" on public.comments for insert to authenticated with check (author_id = auth.uid() and exists (select 1 from public.posts p where p.id = comments.post_id and public.is_organization_member(p.organization_id)));
create policy "members read tasks" on public.work_tasks for select to authenticated using (public.is_organization_member(organization_id));
create policy "members create tasks" on public.work_tasks for insert to authenticated with check (creator_id = auth.uid() and public.is_organization_member(organization_id));
