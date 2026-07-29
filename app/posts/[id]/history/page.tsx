import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PostHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: post } = await supabase.from('posts').select('id,title,author_id').eq('id', id).maybeSingle();
  if (!post || post.author_id !== user.id) notFound();
  const { data: revisions } = await supabase.from('post_revisions').select('id,title,excerpt,created_at').eq('post_id', id).order('created_at', { ascending: false });
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href={`/posts/${id}`}><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Revision history</strong><small>{post.title}</small></div><Link className="back-link" href={`/posts/${id}/edit`}>Edit</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> HISTORY</p><h1>Post revisions</h1><p>Saved revisions are kept whenever you update this post.</p></div><section className="workspace-panel"><div className="workspace-panel-title"><h2>Revisions</h2><span>{revisions?.length ?? 0}</span></div>{revisions?.length ? <div className="live-tasks">{revisions.map((revision) => <article className="live-task" key={revision.id}><div><b>{revision.title}</b><small>{revision.excerpt || 'No summary'} · {new Date(revision.created_at).toLocaleString('ko-KR')}</small></div></article>)}</div> : <div className="empty-state">No saved revisions yet. The first revision is created when you update this post.</div>}</section></section></main>;
}
