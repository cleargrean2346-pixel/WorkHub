-- Suspend every existing non-system-administrator membership. The rows remain
-- for audit purposes, but those accounts cannot access any workspace.
update public.organization_members
set status = 'suspended'
where role <> 'system_admin'
  and status <> 'suspended';

-- Only an existing administrator can create a workspace, including through
-- direct Supabase requests that bypass the app screen.
drop policy if exists "users create organizations" on public.organizations;
create policy "administrators create organizations" on public.organizations
for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.organization_members m
    where m.user_id = auth.uid()
      and m.status = 'approved'
      and m.role in ('organization_admin', 'system_admin')
  )
);

-- Creating a workspace never promotes the creator. Their already-approved
-- administrator role is copied to the new workspace solely so they retain the
-- same access level needed to administer the workspace they created.
create or replace function public.add_organization_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_role public.app_role;
begin
  select role into creator_role
  from public.organization_members
  where user_id = new.created_by
    and status = 'approved'
    and role in ('organization_admin', 'system_admin')
  order by case role when 'system_admin' then 0 else 1 end
  limit 1;

  if creator_role is null then
    raise exception 'Administrator access required to create a workspace.';
  end if;

  insert into public.organization_members (organization_id, user_id, role, status, approved_by, approved_at)
  values (new.id, new.created_by, creator_role, 'approved', new.created_by, now());
  return new;
end;
$$;
