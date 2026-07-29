-- WorkHub base schema. Run this in Supabase SQL Editor before enabling app writes.
create extension if not exists "pgcrypto";

create type public.app_role as enum ('guest', 'member', 'team_leader', 'manager', 'organization_admin', 'system_admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 200),
  slug text not null,
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

create policy "profiles are visible to signed in users" on public.profiles for select to authenticated using (true);
create policy "users update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "members read their organizations" on public.organizations for select to authenticated using (exists (select 1 from public.organization_members m where m.organization_id = id and m.user_id = auth.uid()));
create policy "members read organization memberships" on public.organization_members for select to authenticated using (exists (select 1 from public.organization_members m where m.organization_id = organization_members.organization_id and m.user_id = auth.uid()));
create policy "members read organization posts" on public.posts for select to authenticated using (exists (select 1 from public.organization_members m where m.organization_id = posts.organization_id and m.user_id = auth.uid()));
create policy "authors create posts in their organizations" on public.posts for insert to authenticated with check (author_id = auth.uid() and exists (select 1 from public.organization_members m where m.organization_id = posts.organization_id and m.user_id = auth.uid()));
create policy "authors update their posts" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "members read comments" on public.comments for select to authenticated using (exists (select 1 from public.posts p join public.organization_members m on m.organization_id = p.organization_id where p.id = comments.post_id and m.user_id = auth.uid()));
create policy "members create comments" on public.comments for insert to authenticated with check (author_id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))); return new; end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
