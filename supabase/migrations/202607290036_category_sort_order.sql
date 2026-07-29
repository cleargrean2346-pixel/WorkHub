alter table public.categories
  add column if not exists sort_order integer not null default 0;

with ranked_categories as (
  select id, row_number() over (partition by organization_id order by sort_order, created_at, id) as position
  from public.categories
)
update public.categories categories
set sort_order = ranked_categories.position
from ranked_categories
where categories.id = ranked_categories.id;

create index if not exists categories_organization_sort_order_idx
  on public.categories (organization_id, sort_order, created_at);
