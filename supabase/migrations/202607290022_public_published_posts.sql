create policy "guests read published posts" on public.posts for select to anon using (status = 'published');
create policy "guests read categories" on public.categories for select to anon using (true);
create policy "guests read tags" on public.tags for select to anon using (true);
create policy "guests read post tags" on public.post_tags for select to anon using (true);
