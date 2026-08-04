-- The earliest WorkHub profile is the permanent founder system administrator.
create or replace function public.first_workhub_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles order by created_at asc nulls last, id asc limit 1;
$$;

grant execute on function public.first_workhub_account_id() to authenticated;

-- Backfill the first account in the default workspace and repair a previous
-- pending/suspended state if one exists.
do $$
declare
  founder_id uuid := public.first_workhub_account_id();
  default_organization_id uuid;
begin
  select id into default_organization_id from public.organizations order by created_at asc, id asc limit 1;
  if founder_id is not null and default_organization_id is not null then
    insert into public.organization_members (organization_id, user_id, role, status, approved_by, approved_at)
    values (default_organization_id, founder_id, 'system_admin', 'approved', founder_id, now())
    on conflict (organization_id, user_id) do update
      set role = 'system_admin', status = 'approved', approved_by = excluded.approved_by, approved_at = excluded.approved_at;
  end if;
end;
$$;

-- New accounts stay pending. If the organization already exists when the very
-- first account is created, that first account becomes the permanent founder.
create or replace function public.queue_new_account_for_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_organization_id uuid;
  founder_id uuid;
begin
  select id into default_organization_id from public.organizations order by created_at asc, id asc limit 1;
  founder_id := public.first_workhub_account_id();
  if default_organization_id is not null then
    insert into public.organization_members (organization_id, user_id, role, status, approved_by, approved_at)
    values (
      default_organization_id,
      new.id,
      case when new.id = founder_id then 'system_admin'::public.app_role else 'member'::public.app_role end,
      case when new.id = founder_id then 'approved'::public.membership_status else 'pending'::public.membership_status end,
      case when new.id = founder_id then new.id else null end,
      case when new.id = founder_id then now() else null end
    ) on conflict (organization_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

-- The founder can create the first workspace even before a membership row
-- exists; all other workspace creators must already be administrators.
drop policy if exists "administrators create organizations" on public.organizations;
create policy "administrators create organizations" on public.organizations
for insert to authenticated
with check (
  created_by = auth.uid() and (
    auth.uid() = public.first_workhub_account_id()
    or exists (select 1 from public.organization_members m where m.user_id = auth.uid() and m.status = 'approved' and m.role in ('organization_admin', 'system_admin'))
  )
);

create or replace function public.add_organization_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare creator_role public.app_role;
begin
  if new.created_by = public.first_workhub_account_id() then
    creator_role := 'system_admin';
  else
    select role into creator_role from public.organization_members
    where user_id = new.created_by and status = 'approved' and role in ('organization_admin', 'system_admin')
    order by case role when 'system_admin' then 0 else 1 end limit 1;
  end if;
  if creator_role is null then raise exception 'Administrator access required to create a workspace.'; end if;
  insert into public.organization_members (organization_id, user_id, role, status, approved_by, approved_at)
  values (new.id, new.created_by, creator_role, 'approved', new.created_by, now());
  return new;
end;
$$;

-- The founder's system administrator membership can never be changed or removed.
create or replace function public.prevent_system_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'system_admin' and old.user_id = public.first_workhub_account_id() then
    if tg_op = 'DELETE' or new.role <> 'system_admin' or new.status <> 'approved' then
      raise exception 'The founder system administrator is permanent.';
    end if;
  elsif tg_op = 'DELETE' and old.role = 'system_admin' then
    raise exception 'The system administrator cannot be removed.';
  elsif tg_op = 'UPDATE' and old.role = 'system_admin' and (new.role <> 'system_admin' or new.status <> 'approved') and auth.uid() is distinct from old.user_id then
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
  if target_user_id = public.first_workhub_account_id() and next_role <> 'system_admin' then raise exception 'The founder system administrator is permanent.'; end if;
  if target_role = 'system_admin' and next_role <> 'system_admin' and auth.uid() is distinct from target_user_id then raise exception 'Only the system administrator can demote themself.'; end if;
  update public.organization_members set role = next_role where organization_id = target_organization_id and user_id = target_user_id and status = 'approved';
end;
$$;

grant execute on function public.admin_set_member_role(uuid, uuid, public.app_role) to authenticated;
