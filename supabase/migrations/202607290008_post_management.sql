create policy "authors delete posts" on public.posts for delete to authenticated using (author_id = auth.uid());
create policy "authors update comments" on public.comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete comments" on public.comments for delete to authenticated using (author_id = auth.uid());
