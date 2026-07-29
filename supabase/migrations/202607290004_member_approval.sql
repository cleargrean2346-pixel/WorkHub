-- Adds administrator-controlled organization membership approval.
do $$ begin
  create type public.membership_status as enum ('pending', 'approved', 'suspended');
exception when duplicate_object then null;
end $$;

alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where p.id = u.id and p.email is null;
create unique index if not exists profiles_email_unique on public.profiles (lower(email)) where email is not null;

alter table public.organization_members
  add column if not exists status public.membership_status not null default 'approved',
  add column if not exists invited_by uuid references public.profiles(id),
  add column if not exists invited_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz;

update public.organization_members set status = 'approved' where status is null;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.is_organization_member(target_organization_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id and user_id = auth.uid() and status = 'approved'
  );
$$;

create or replace function public.is_organization_admin(target_organization_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and status = 'approved'
      and role in ('organization_admin', 'system_admin')
  );
$$;

grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;

drop policy if exists "members read organization memberships" on public.organization_members;
create policy "members read organization memberships" on public.organization_members
for select to authenticated
using (user_id = auth.uid() or public.is_organization_admin(organization_id));

create policy "organization admins invite members" on public.organization_members
for insert to authenticated
with check (public.is_organization_admin(organization_id));

create policy "organization admins approve members" on public.organization_members
for update to authenticated
using (public.is_organization_admin(organization_id))
with check (public.is_organization_admin(organization_id));
