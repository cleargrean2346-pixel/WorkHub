-- Show accounts that existed before the approval queue was introduced.
-- WorkHub currently uses the earliest-created organization as its default workspace.
do $$
declare
  default_organization_id uuid;
begin
  select id into default_organization_id
  from public.organizations
  order by created_at asc, id asc
  limit 1;

  if default_organization_id is null then
    raise notice 'No organization exists yet; existing accounts were not added.';
    return;
  end if;

  insert into public.organization_members (organization_id, user_id, role, status)
  select default_organization_id, p.id, 'member', 'pending'
  from public.profiles p
  where not exists (
    select 1 from public.organization_members m
    where m.organization_id = default_organization_id and m.user_id = p.id
  );
end;
$$;
