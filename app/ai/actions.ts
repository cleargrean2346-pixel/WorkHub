'use server';

import { decryptApiKey } from '@/lib/ai/crypto';
import { createClient } from '@/lib/supabase/server';

type AiResult = { ok: boolean; text: string };
type Settings = { provider: string; encrypted_api_key: string; model: string | null; base_url: string | null };

function errorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const value = data as { error?: { message?: string } | string; message?: string };
  if (typeof value.error === 'string') return value.error;
  return value.error?.message || value.message || fallback;
}

async function compatibleRequest(settings: Settings, prompt: string, key: string): Promise<AiResult> {
  const defaults: Record<string, string> = { openrouter: 'https://openrouter.ai/api/v1', deepseek: 'https://api.deepseek.com/v1', groq: 'https://api.groq.com/openai/v1' };
  const base = (settings.base_url || defaults[settings.provider] || '').replace(/\/$/, '');
  if (!base) return { ok: false, text: '이 제공자는 AI 설정에서 HTTPS Base URL을 입력해야 합니다.' };
  const response = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: settings.model || 'default', messages: [{ role: 'user', content: prompt }], temperature: 0.3 }), cache: 'no-store' });
  const data = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }> } | null;
  if (!response.ok) return { ok: false, text: errorMessage(data, 'AI 요청에 실패했습니다.') };
  return { ok: true, text: data?.choices?.[0]?.message?.content?.trim() || '응답 텍스트가 없습니다.' };
}

async function callAi(prompt: string): Promise<AiResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, text: '먼저 로그인해 주세요.' };
  const { data: settings } = await supabase.from('user_ai_settings').select('provider, encrypted_api_key, model, base_url').eq('user_id', user.id).maybeSingle();
  if (!settings) return { ok: false, text: 'AI 설정에서 API 키를 먼저 저장해 주세요.' };
  try {
    const key = decryptApiKey(settings.encrypted_api_key);
    if (settings.provider === 'openai') {
      const response = await fetch(`${(settings.base_url || 'https://api.openai.com/v1').replace(/\/$/, '')}/responses`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: settings.model || 'gpt-4.1-mini', input: prompt }), cache: 'no-store' });
      const data = await response.json().catch(() => null) as { output_text?: string } | null;
      if (!response.ok) return { ok: false, text: errorMessage(data, 'OpenAI 요청에 실패했습니다.') };
      return { ok: true, text: data?.output_text?.trim() || '응답 텍스트가 없습니다.' };
    }
    if (settings.provider === 'anthropic') {
      const response = await fetch(`${(settings.base_url || 'https://api.anthropic.com/v1').replace(/\/$/, '')}/messages`, { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: settings.model || 'claude-3-5-haiku-latest', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }), cache: 'no-store' });
      const data = await response.json().catch(() => null) as { content?: Array<{ text?: string }> } | null;
      if (!response.ok) return { ok: false, text: errorMessage(data, 'Anthropic 요청에 실패했습니다.') };
      return { ok: true, text: data?.content?.map((item) => item.text || '').join('\n').trim() || '응답 텍스트가 없습니다.' };
    }
    if (settings.provider === 'gemini') {
      const model = settings.model || 'gemini-2.0-flash';
      const base = (settings.base_url || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
      const response = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }), cache: 'no-store' });
      const data = await response.json().catch(() => null) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null;
      if (!response.ok) return { ok: false, text: errorMessage(data, 'Gemini 요청에 실패했습니다.') };
      return { ok: true, text: data?.candidates?.[0]?.content?.parts?.map((item) => item.text || '').join('\n').trim() || '응답 텍스트가 없습니다.' };
    }
    return compatibleRequest(settings, prompt, key);
  } catch {
    return { ok: false, text: 'AI 제공자에 연결하지 못했습니다. API 키, 모델, Base URL을 확인해 주세요.' };
  }
}

export async function testAiConnection() { return callAi('WorkHub 연결 테스트입니다. 정확히 “연결 성공”이라고만 답하세요.'); }

export async function summarizeText(formData: FormData) {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return { ok: false, text: '요약할 텍스트를 입력해 주세요.' };
  return callAi(`다음 텍스트를 한국어로 핵심 3개 항목으로 요약하세요. 원문에 없는 정보는 추가하지 마세요.\n\n${content.slice(0, 12000)}`);
}

export async function suggestTitles(formData: FormData) {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return { ok: false, text: '게시글 초안을 입력해 주세요.' };
  return callAi(`다음 게시글에 어울리는 간결한 한국어 제목 5개를 번호 목록으로 제안하세요.\n\n${content.slice(0, 12000)}`);
}
