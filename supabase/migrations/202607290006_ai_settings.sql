create table if not exists public.user_ai_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic', 'gemini', 'openrouter', 'deepseek', 'groq', 'compatible')),
  encrypted_api_key text not null,
  model text,
  base_url text,
  updated_at timestamptz not null default now()
);

alter table public.user_ai_settings enable row level security;
create policy "users read their ai settings" on public.user_ai_settings for select to authenticated using (user_id = auth.uid());
create policy "users create their ai settings" on public.user_ai_settings for insert to authenticated with check (user_id = auth.uid());
create policy "users update their ai settings" on public.user_ai_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users delete their ai settings" on public.user_ai_settings for delete to authenticated using (user_id = auth.uid());
