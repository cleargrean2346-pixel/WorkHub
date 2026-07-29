create or replace function public.admin_set_member_role(
  target_organization_id uuid,
  target_user_id uuid,
  next_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_organization_admin(target_organization_id) then
    raise exception 'Administrator access required.';
  end if;

  if next_role not in ('member', 'team_leader', 'manager', 'organization_admin') then
    raise exception 'This role cannot be assigned.';
  end if;

  if exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = target_user_id
      and role = 'system_admin'
  ) then
    raise exception 'The system administrator cannot be changed.';
  end if;

  update public.organization_members
  set role = next_role
  where organization_id = target_organization_id
    and user_id = target_user_id
    and status = 'approved';

  if not found then
    raise exception 'Approved member not found.';
  end if;
end;
$$;

grant execute on function public.admin_set_member_role(uuid, uuid, public.app_role) to authenticated;
