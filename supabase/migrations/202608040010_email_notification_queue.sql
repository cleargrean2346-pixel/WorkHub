create table if not exists public.email_notification_queue (
  id uuid primary key default gen_random_uuid(), notification_id uuid not null unique references public.notifications(id) on delete cascade,
  recipient_email text not null, subject text not null, body text not null default '', link text,
  status text not null default 'pending' check (status in ('pending','sent','failed')), attempts integer not null default 0,
  last_error text, sent_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.email_notification_queue enable row level security;
create or replace function public.queue_email_notification() returns trigger language plpgsql security definer set search_path = public as $$
declare recipient text; enabled boolean;
begin
  select p.email, coalesce(pref.email_enabled, false) into recipient, enabled from public.profiles p left join public.user_notification_preferences pref on pref.user_id = p.id where p.id = new.user_id;
  if enabled and recipient is not null then insert into public.email_notification_queue(notification_id,recipient_email,subject,body,link) values(new.id,recipient,new.title,new.body,new.link) on conflict(notification_id) do nothing; end if;
  return new;
end;
$$;
drop trigger if exists notifications_queue_email on public.notifications;
create trigger notifications_queue_email after insert on public.notifications for each row execute function public.queue_email_notification();
