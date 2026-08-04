-- Keep the approval queue current: every newly created auth account is added
-- to the default WorkHub organization as a pending member automatically.
create or replace function public.queue_new_account_for_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_organization_id uuid;
begin
  select id into default_organization_id
  from public.organizations
  order by created_at asc, id asc
  limit 1;

  if default_organization_id is not null then
    insert into public.organization_members (organization_id, user_id, role, status)
    values (default_organization_id, new.id, 'member', 'pending')
    on conflict (organization_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

-- The existing profile trigger is named on_auth_user_created and runs first,
-- so the referenced profile row exists before the membership is inserted.
drop trigger if exists on_auth_user_queued_for_approval on auth.users;
create trigger on_auth_user_queued_for_approval
after insert on auth.users
for each row execute procedure public.queue_new_account_for_approval();
