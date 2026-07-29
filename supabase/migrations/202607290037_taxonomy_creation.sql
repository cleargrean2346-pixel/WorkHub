alter table public.categories
  add column if not exists sort_order integer not null default 0;

create or replace function public.admin_create_taxonomy(
  target_organization_id uuid,
  taxonomy_type text,
  taxonomy_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  item_id uuid;
  item_slug text;
  next_sort_order integer;
begin
  if not public.is_organization_admin(target_organization_id) then
    raise exception 'Administrator access required.';
  end if;
  if taxonomy_type not in ('categories', 'tags') then
    raise exception 'Invalid taxonomy type.';
  end if;
  if char_length(trim(taxonomy_name)) not between 1 and 80 then
    raise exception 'A name between 1 and 80 characters is required.';
  end if;

  item_slug := coalesce(nullif(regexp_replace(lower(trim(taxonomy_name)), '[^a-z0-9]+', '-', 'g'), ''), taxonomy_type) || '-' || substring(gen_random_uuid()::text, 1, 8);

  if taxonomy_type = 'categories' then
    select coalesce(max(sort_order), 0) + 1 into next_sort_order
    from public.categories where organization_id = target_organization_id;
    insert into public.categories (organization_id, name, slug, sort_order)
    values (target_organization_id, trim(taxonomy_name), item_slug, next_sort_order)
    returning id into item_id;
  else
    insert into public.tags (organization_id, name, slug)
    values (target_organization_id, trim(taxonomy_name), item_slug)
    returning id into item_id;
  end if;
  return item_id;
end;
$$;

grant execute on function public.admin_create_taxonomy(uuid, text, text) to authenticated;
