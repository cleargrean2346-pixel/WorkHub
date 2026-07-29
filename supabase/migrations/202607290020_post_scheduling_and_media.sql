alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('draft','scheduled','published','archived'));
alter table public.posts add column if not exists cover_image_url text;
alter table public.posts add column if not exists scheduled_at timestamptz;
create index if not exists posts_scheduled_at_idx on public.posts (scheduled_at) where status = 'scheduled';
create or replace function public.publish_due_posts() returns integer language plpgsql security definer set search_path = public as $$
declare updated_count integer;
begin update public.posts set status='published', published_at=now(), updated_at=now() where status='scheduled' and scheduled_at is not null and scheduled_at <= now(); get diagnostics updated_count = row_count; return updated_count; end;
$$;
grant execute on function public.publish_due_posts() to authenticated;
