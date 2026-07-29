create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;

create policy "members read categories" on public.categories for select to authenticated using (public.is_organization_member(organization_id));
create policy "admins manage categories" on public.categories for all to authenticated using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "members read tags" on public.tags for select to authenticated using (public.is_organization_member(organization_id));
create policy "admins manage tags" on public.tags for all to authenticated using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "members read post tags" on public.post_tags for select to authenticated using (exists (select 1 from public.posts p where p.id = post_id and public.is_organization_member(p.organization_id)));
create policy "authors manage post tags" on public.post_tags for all to authenticated using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "members read likes" on public.likes for select to authenticated using (exists (select 1 from public.posts p where p.id = post_id and public.is_organization_member(p.organization_id)));
create policy "users add likes" on public.likes for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.is_organization_member(p.organization_id)));
create policy "users remove likes" on public.likes for delete to authenticated using (user_id = auth.uid());
create policy "users read their bookmarks" on public.bookmarks for select to authenticated using (user_id = auth.uid());
create policy "users add bookmarks" on public.bookmarks for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.is_organization_member(p.organization_id)));
create policy "users remove bookmarks" on public.bookmarks for delete to authenticated using (user_id = auth.uid());
