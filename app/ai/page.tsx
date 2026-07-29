'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { suggestTitles, summarizeText, testAiConnection } from './actions';

type Result = { ok: boolean; text: string } | null;

export default function AiToolsPage() {
  const [result, setResult] = useState<Result>(null);
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ ok: boolean; text: string }>) => startTransition(async () => setResult(await action()));
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>AI tools</strong><small>OpenAI personal key</small></div><Link className="back-link" href="/settings/ai">AI settings</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> AI TOOLS</p><h1>Use your own AI key</h1><p>Your key stays encrypted on the server and is used only for your requests.</p><button className="primary" disabled={pending} onClick={() => run(testAiConnection)}>{pending ? 'Working...' : 'Test OpenAI connection'}</button></div><div className="workspace-grid"><section className="workspace-panel"><h2>Summarize text</h2><form className="task-form" action={(formData) => run(() => summarizeText(formData))}><label htmlFor="summary-content">Text</label><textarea id="summary-content" name="content" rows={10} required maxLength={12000} /><button className="primary" disabled={pending}>Create summary</button></form></section><section className="workspace-panel"><h2>Suggest post titles</h2><form className="task-form" action={(formData) => run(() => suggestTitles(formData))}><label htmlFor="title-content">Post content</label><textarea id="title-content" name="content" rows={10} required maxLength={12000} /><button className="primary" disabled={pending}>Suggest titles</button></form></section></div>{result && <section className="workspace-panel"><h2>{result.ok ? 'AI result' : 'AI error'}</h2><div style={{ whiteSpace: 'pre-wrap' }}>{result.text}</div></section>}</section></main>;
}
