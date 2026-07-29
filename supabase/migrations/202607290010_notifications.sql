create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('member_invited', 'member_approved', 'request_decided', 'comment_added', 'system')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
create policy "users read their notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users update their notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.create_organization_notification(target_user_id uuid, target_organization_id uuid, notification_kind text, notification_title text, notification_body text default '', notification_link text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare notification_id uuid;
begin
  if not public.is_organization_member(target_organization_id) then raise exception 'not an organization member'; end if;
  if not exists (select 1 from public.organization_members where organization_id = target_organization_id and user_id = target_user_id) then raise exception 'target is not an organization member'; end if;
  insert into public.notifications (user_id, organization_id, kind, title, body, link)
  values (target_user_id, target_organization_id, notification_kind, notification_title, notification_body, notification_link)
  returning id into notification_id;
  return notification_id;
end;
$$;
grant execute on function public.create_organization_notification(uuid, uuid, text, text, text, text) to authenticated;
