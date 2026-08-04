-- Role assignment in the member list also restores a previously suspended
-- account. Pending accounts remain approval-queue only.
create or replace function public.admin_set_member_role(target_organization_id uuid, target_user_id uuid, next_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
declare actor_role public.app_role; target_role public.app_role; target_status public.membership_status;
begin
  select role into actor_role from public.organization_members where organization_id=target_organization_id and user_id=auth.uid() and status='approved';
  if actor_role not in ('organization_admin','system_admin') then raise exception 'Administrator access required.'; end if;
  select role,status into target_role,target_status from public.organization_members where organization_id=target_organization_id and user_id=target_user_id;
  if target_role is null then raise exception 'Member not found.'; end if;
  if target_status='pending' then raise exception 'Pending members must be approved from the approval queue.'; end if;
  if next_role='system_admin' and actor_role<>'system_admin' then raise exception 'Only a system administrator can appoint a system administrator.'; end if;
  if target_user_id=public.first_workhub_account_id() and next_role<>'system_admin' then raise exception 'The founder system administrator is permanent.'; end if;
  if target_role='system_admin' and next_role<>'system_admin' then raise exception 'System administrator role cannot be changed here.'; end if;
  update public.organization_members
  set role=next_role,
      status=case when status='suspended' then 'approved'::public.membership_status else status end,
      approved_by=case when status='suspended' then auth.uid() else approved_by end,
      approved_at=case when status='suspended' then now() else approved_at end
  where organization_id=target_organization_id and user_id=target_user_id;
end;
$$;
grant execute on function public.admin_set_member_role(uuid,uuid,public.app_role) to authenticated;
