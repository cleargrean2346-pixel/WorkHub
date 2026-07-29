drop policy if exists "members read projects" on public.projects;
drop policy if exists "members create projects" on public.projects;
drop policy if exists "creators update projects" on public.projects;
drop policy if exists "creators delete projects" on public.projects;
drop policy if exists "members read task comments" on public.task_comments;
drop policy if exists "members create task comments" on public.task_comments;
drop policy if exists "authors update task comments" on public.task_comments;
drop policy if exists "authors delete task comments" on public.task_comments;

create policy "members read projects" on public.projects for select to authenticated using (public.is_organization_member(organization_id));
create policy "members create projects" on public.projects for insert to authenticated with check (creator_id=auth.uid() and public.is_organization_member(organization_id));
create policy "creators update projects" on public.projects for update to authenticated using (creator_id=auth.uid()) with check (creator_id=auth.uid());
create policy "creators delete projects" on public.projects for delete to authenticated using (creator_id=auth.uid());
create policy "members read task comments" on public.task_comments for select to authenticated using (exists(select 1 from public.work_tasks t where t.id=task_id and public.is_organization_member(t.organization_id)));
create policy "members create task comments" on public.task_comments for insert to authenticated with check (author_id=auth.uid() and exists(select 1 from public.work_tasks t where t.id=task_id and public.is_organization_member(t.organization_id)));
create policy "authors update task comments" on public.task_comments for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy "authors delete task comments" on public.task_comments for delete to authenticated using (author_id=auth.uid());
