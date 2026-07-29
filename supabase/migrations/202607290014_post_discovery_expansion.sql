alter table public.posts add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.posts add column if not exists view_count integer not null default 0 check (view_count >= 0);

create or replace function public.increment_post_views(target_post_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.posts set view_count = view_count + 1 where id = target_post_id and exists (select 1 from public.posts p where p.id = target_post_id and public.is_organization_member(p.organization_id));
end;
$$;
grant execute on function public.increment_post_views(uuid) to authenticated;
