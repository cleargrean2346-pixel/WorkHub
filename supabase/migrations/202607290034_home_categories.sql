alter table public.site_settings
  add column if not exists home_category_ids uuid[] not null default '{}';
