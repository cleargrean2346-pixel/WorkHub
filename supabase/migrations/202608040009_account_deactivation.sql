-- Allows a user to suspend only their own memberships without granting broad member-update access.
create or replace function public.deactivate_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  update public.organization_members set status = 'suspended' where user_id = auth.uid();
end;
$$;
grant execute on function public.deactivate_my_account() to authenticated;
