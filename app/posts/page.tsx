import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Post = { id: string; title: string; body: string; status: string; created_at: string; published_at: string | null };

export default async function PostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) return <main className="onboarding"><section className="onboarding-card"><h1>Join a workspace first</h1><Link className="primary" href="/workspace">Open workspace</Link></section></main>;
  const { data: rows } = await supabase.from('posts').select('id, title, body, status, created_at, published_at').eq('organization_id', membership.organization_id).order('created_at', { ascending: false });
  const posts = (rows ?? []) as Post[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Knowledge</strong><small>Organization posts</small></div><Link href="/workspace" className="back-link">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> KNOWLEDGE</p><h1>Share what your team knows</h1><p>Write updates, notes, and useful guides for your workspace.</p><Link className="primary" href="/posts/new">Write post</Link></div><section className="workspace-panel"><div className="workspace-panel-title"><h2>All posts</h2><span>{posts.length}</span></div>{posts.length ? <div className="live-tasks">{posts.map((post) => <Link className="live-task" href={`/posts/${post.id}`} key={post.id}><div><b>{post.title}</b><small>{post.status} · {new Date(post.created_at).toLocaleDateString('ko-KR')} · {post.body.slice(0, 120) || 'No content yet.'}</small></div></Link>)}</div> : <div className="empty-state">No posts yet. Create the first one.</div>}</section></section></main>;
}
