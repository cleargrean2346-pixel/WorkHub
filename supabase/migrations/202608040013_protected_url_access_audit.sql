create or replace function public.resolve_protected_url(token text)
returns text language plpgsql security definer set search_path = public as $$
declare target_url text; target_organization_id uuid;
begin
  select p.organization_id into target_organization_id from public.protected_urls u join public.posts p on p.id=u.post_id where u.protected_token=token;
  select u.original_url into target_url from public.protected_urls u join public.posts p on p.id=u.post_id where u.protected_token=token and u.enabled=true and public.is_organization_member(p.organization_id);
  if target_url is null then
    if target_organization_id is not null and auth.uid() is not null then insert into public.audit_logs(organization_id,actor_id,action,target_type,target_id,details) values(target_organization_id,auth.uid(),'protected_url_denied','protected_url',token,jsonb_build_object('reason','unavailable_or_not_authorized')); end if;
    raise exception 'protected link unavailable';
  end if;
  insert into public.audit_logs(organization_id,actor_id,action,target_type,target_id,details) values(target_organization_id,auth.uid(),'protected_url_opened','protected_url',token,'{}'::jsonb);
  return target_url;
end;
$$;
