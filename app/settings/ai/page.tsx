import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { removeAiSettings, saveAiSettings } from './actions';

export default async function AiSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: settings } = await supabase.from('user_ai_settings').select('provider,model,base_url,updated_at').eq('user_id', user.id).maybeSingle();
  return <main className="onboarding"><section className="onboarding-card">
    <Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link>
    <p className="eyebrow"><span /> PRIVATE AI SETTINGS</p><h1>Connect your own AI key</h1><p>Your API key is encrypted on the server and cannot be viewed after saving. Replace it by entering a new key below.</p>
    {settings && <p>Saved provider: <b>{settings.provider}</b>{settings.model ? ` · ${settings.model}` : ''}</p>}
    <form action={saveAiSettings}><label htmlFor="provider">Provider</label><select id="provider" name="provider" defaultValue={settings?.provider || 'openai'}><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="gemini">Google Gemini</option><option value="openrouter">OpenRouter</option><option value="deepseek">DeepSeek</option><option value="groq">Groq</option><option value="compatible">OpenAI compatible API</option></select><label htmlFor="apiKey">API key</label><input id="apiKey" name="apiKey" type="password" placeholder={settings ? 'Enter a new key to replace the saved key' : 'Paste your API key'} required autoComplete="off"/><label htmlFor="model">Default model (optional)</label><input id="model" name="model" defaultValue={settings?.model || ''} placeholder="Example: gpt-5"/><label htmlFor="baseUrl">Custom base URL (optional)</label><input id="baseUrl" name="baseUrl" defaultValue={settings?.base_url || ''} placeholder="https://api.example.com/v1"/><button className="primary">Save encrypted settings</button></form>
    {settings && <form action={removeAiSettings}><button className="text-button">Remove saved key</button></form>}
    <Link className="back-link" href="/workspace">Back to workspace</Link>
  </section></main>;
}
