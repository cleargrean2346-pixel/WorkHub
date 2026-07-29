create or replace function public.admin_delete_taxonomy(
  target_organization_id uuid,
  taxonomy_type text,
  taxonomy_id uuid
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
  if taxonomy_type = 'categories' then
    delete from public.categories where id = taxonomy_id and organization_id = target_organization_id;
  elsif taxonomy_type = 'tags' then
    delete from public.tags where id = taxonomy_id and organization_id = target_organization_id;
  else
    raise exception 'Invalid taxonomy type.';
  end if;
  if not found then raise exception 'Item not found.'; end if;
end;
$$;

grant execute on function public.admin_delete_taxonomy(uuid, text, uuid) to authenticated;
