drop policy if exists "members read task watchers" on public.task_watchers;
drop policy if exists "members watch tasks" on public.task_watchers;
drop policy if exists "users unwatch tasks" on public.task_watchers;
drop policy if exists "members read task activity" on public.task_activity;
drop policy if exists "members add task activity" on public.task_activity;

create policy "members read task watchers" on public.task_watchers for select to authenticated using (exists(select 1 from public.work_tasks t where t.id=task_id and public.is_organization_member(t.organization_id)));
create policy "members watch tasks" on public.task_watchers for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.work_tasks t where t.id=task_id and public.is_organization_member(t.organization_id)));
create policy "users unwatch tasks" on public.task_watchers for delete to authenticated using (user_id=auth.uid());
create policy "members read task activity" on public.task_activity for select to authenticated using (exists(select 1 from public.work_tasks t where t.id=task_id and public.is_organization_member(t.organization_id)));
create policy "members add task activity" on public.task_activity for insert to authenticated with check (actor_id=auth.uid() and exists(select 1 from public.work_tasks t where t.id=task_id and public.is_organization_member(t.organization_id)));
