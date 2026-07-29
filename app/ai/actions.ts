'use server';

import { decryptApiKey } from '@/lib/ai/crypto';
import { createClient } from '@/lib/supabase/server';

type AiResult = { ok: boolean; text: string };

async function callOpenAi(prompt: string): Promise<AiResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, text: 'Please sign in first.' };
  const { data: settings } = await supabase.from('user_ai_settings').select('provider, encrypted_api_key, model').eq('user_id', user.id).maybeSingle();
  if (!settings) return { ok: false, text: 'Save an AI API key first in AI settings.' };
  if (settings.provider !== 'openai') return { ok: false, text: 'This first AI release currently supports the OpenAI provider only.' };
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${decryptApiKey(settings.encrypted_api_key)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: settings.model || 'gpt-5.6-luna', input: prompt, text: { verbosity: 'low' } }),
      cache: 'no-store',
    });
    const data = await response.json() as { output_text?: string; error?: { message?: string } };
    if (!response.ok) return { ok: false, text: data.error?.message || 'OpenAI request failed.' };
    return { ok: true, text: data.output_text?.trim() || 'No response text was returned.' };
  } catch {
    return { ok: false, text: 'Unable to contact OpenAI. Check your encrypted key and Vercel environment variable.' };
  }
}

export async function testAiConnection() {
  return callOpenAi('Reply with exactly: WorkHub connection successful.');
}

export async function summarizeText(formData: FormData) {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return { ok: false, text: 'Enter text to summarize.' };
  return callOpenAi(`Summarize the following text in Korean in 3 concise bullet points. Do not add information not in the text.\n\n${content.slice(0, 12000)}`);
}

export async function suggestTitles(formData: FormData) {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return { ok: false, text: 'Enter post content first.' };
  return callOpenAi(`Suggest 5 concise Korean titles for the following post. Return only a numbered list.\n\n${content.slice(0, 12000)}`);
}
