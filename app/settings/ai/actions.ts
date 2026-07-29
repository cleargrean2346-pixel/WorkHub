'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { encryptApiKey } from '@/lib/ai/crypto';
import { createClient } from '@/lib/supabase/server';

const providers = ['openai', 'anthropic', 'gemini', 'openrouter', 'deepseek', 'groq', 'compatible'];

export async function saveAiSettings(formData: FormData) {
  const provider = String(formData.get('provider') ?? '');
  const apiKey = String(formData.get('apiKey') ?? '').trim();
  const model = String(formData.get('model') ?? '').trim();
  const baseUrl = String(formData.get('baseUrl') ?? '').trim();
  if (!providers.includes(provider) || !apiKey) throw new Error('Provider and API key are required.');
  if (baseUrl && !/^https:\/\//.test(baseUrl)) throw new Error('Base URL must start with https://');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { error } = await supabase.from('user_ai_settings').upsert({ user_id: user.id, provider, encrypted_api_key: encryptApiKey(apiKey), model: model || null, base_url: baseUrl || null, updated_at: new Date().toISOString() });
  if (error) throw new Error('Unable to save AI settings.');
  revalidatePath('/settings/ai');
}

export async function removeAiSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { error } = await supabase.from('user_ai_settings').delete().eq('user_id', user.id);
  if (error) throw new Error('Unable to remove AI settings.');
  revalidatePath('/settings/ai');
}
