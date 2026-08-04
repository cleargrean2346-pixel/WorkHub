-- Google sign-ins join the first WorkHub organization as pending members.
create or replace function public.request_default_organization_access()
returns uuid language plpgsql security definer set search_path = public as $$
declare default_organization_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select id into default_organization_id from public.organizations order by created_at asc, id asc limit 1;
  if default_organization_id is null then return null; end if;
  insert into public.organization_members (organization_id, user_id, role, status)
  values (default_organization_id, auth.uid(), 'member', 'pending')
  on conflict (organization_id, user_id) do nothing;
  return default_organization_id;
end;
$$;
grant execute on function public.request_default_organization_access() to authenticated;

-- System administrators may appoint another system administrator. Only the
-- system administrator themself may demote their own membership.
create or replace function public.prevent_system_admin_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' and old.role = 'system_admin' then raise exception 'The system administrator cannot be removed.'; end if;
  if tg_op = 'UPDATE' and old.role = 'system_admin' and (new.role <> 'system_admin' or new.status <> 'approved') and auth.uid() is distinct from old.user_id then
    raise exception 'Only the system administrator can demote themself.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.admin_set_member_role(target_organization_id uuid, target_user_id uuid, next_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
declare actor_role public.app_role; target_role public.app_role;
begin
  select role into actor_role from public.organization_members where organization_id = target_organization_id and user_id = auth.uid() and status = 'approved';
  if actor_role not in ('organization_admin', 'system_admin') then raise exception 'Administrator access required.'; end if;
  select role into target_role from public.organization_members where organization_id = target_organization_id and user_id = target_user_id and status = 'approved';
  if target_role is null then raise exception 'Approved member not found.'; end if;
  if next_role = 'system_admin' and actor_role <> 'system_admin' then raise exception 'Only a system administrator can appoint a system administrator.'; end if;
  if target_role = 'system_admin' and next_role <> 'system_admin' and auth.uid() is distinct from target_user_id then raise exception 'Only the system administrator can demote themself.'; end if;
  update public.organization_members set role = next_role where organization_id = target_organization_id and user_id = target_user_id and status = 'approved';
end;
$$;
grant execute on function public.admin_set_member_role(uuid, uuid, public.app_role) to authenticated;

-- Deactivation is recoverable: the membership remains visible, but no longer has workspace access.
create or replace function public.admin_suspend_member(target_organization_id uuid, target_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare actor_role public.app_role; target_role public.app_role;
begin
  select role into actor_role from public.organization_members where organization_id = target_organization_id and user_id = auth.uid() and status = 'approved';
  if actor_role not in ('organization_admin', 'system_admin') then raise exception 'Administrator access required.'; end if;
  select role into target_role from public.organization_members where organization_id = target_organization_id and user_id = target_user_id and status = 'approved';
  if target_role is null then raise exception 'Approved member not found.'; end if;
  if target_role = 'system_admin' then raise exception 'The system administrator cannot be removed.'; end if;
  update public.organization_members set status = 'suspended' where organization_id = target_organization_id and user_id = target_user_id;
end;
$$;
grant execute on function public.admin_suspend_member(uuid, uuid) to authenticated;
