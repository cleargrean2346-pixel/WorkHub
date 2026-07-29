-- The earliest WorkHub account becomes the permanent system administrator.
-- A system administrator keeps all ordinary administrator permissions, but cannot be demoted,
-- suspended, or removed through organization membership changes.

create or replace function public.add_organization_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_role public.app_role := 'organization_admin';
begin
  if not exists (select 1 from public.organization_members where role = 'system_admin') then
    creator_role := 'system_admin';
  end if;

  insert into public.organization_members (organization_id, user_id, role, status, approved_by, approved_at)
  values (new.id, new.created_by, creator_role, 'approved', new.created_by, now());
  return new;
end;
$$;

-- Upgrade the first account already registered in this project when its first workspace exists.
with first_account as (
  select p.id
  from public.profiles p
  join public.organization_members m on m.user_id = p.id
  order by p.created_at asc nulls last, p.id asc
  limit 1
)
update public.organization_members m
set role = 'system_admin', status = 'approved'
where m.user_id = (select id from first_account)
  and not exists (select 1 from public.organization_members where role = 'system_admin');

create or replace function public.prevent_system_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and old.role = 'system_admin' then
    raise exception 'The system administrator cannot be removed.';
  end if;

  if tg_op = 'UPDATE' and old.role = 'system_admin'
    and (new.role <> 'system_admin' or new.status <> 'approved') then
    raise exception 'The system administrator cannot be demoted or suspended.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_system_admin_membership on public.organization_members;
create trigger protect_system_admin_membership
before update or delete on public.organization_members
for each row execute procedure public.prevent_system_admin_change();
