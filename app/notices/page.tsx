import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Notice = { id: string; title: string; body: string; pinned: boolean; published_at: string | null };

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('notices').select('id,title,body,pinned,published_at').eq('status', 'published').order('pinned', { ascending: false }).order('published_at', { ascending: false });
  const notices = (rows ?? []) as Notice[];
  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Notices</strong><small>Latest updates</small></div><Link className="back-link" href="/">Home</Link></header>
    <section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> UPDATES</p><h1>Notices</h1><p>Official updates and important information from the workspace.</p></div><section className="workspace-panel"><div className="workspace-panel-title"><h2>Published notices</h2><span>{notices.length}</span></div>{notices.length ? <div className="live-tasks">{notices.map((notice) => <article className="live-task" key={notice.id}><div><b>{notice.pinned ? 'Pinned · ' : ''}{notice.title}</b><small>{notice.published_at ? new Date(notice.published_at).toLocaleDateString('ko-KR') : 'Recently published'}</small><p style={{ whiteSpace: 'pre-wrap' }}>{notice.body}</p></div></article>)}</div> : <div className="empty-state">There are no published notices yet.</div>}</section></section>
  </main>;
}
