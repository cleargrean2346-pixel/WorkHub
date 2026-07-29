import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ManagePostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: member } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!member || !['organization_admin', 'system_admin'].includes(member.role)) return <main className="onboarding"><section className="onboarding-card"><h1>Administrator access required</h1><Link className="primary" href="/workspace">Workspace</Link></section></main>;
  const { data: posts } = await supabase.from('posts').select('id,title,status,featured,comments_enabled,created_at,view_count').eq('organization_id', member.organization_id).order('created_at', { ascending: false }).limit(100);
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Post management</strong><small>Publishing and moderation overview</small></div><Link className="back-link" href="/manage/dashboard">Admin</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>Manage published knowledge</h1><p>Review status, visibility, and reader activity for organization posts.</p></div><section className="workspace-panel"><div className="workspace-panel-title"><h2>Posts</h2><span>{posts?.length ?? 0}</span></div>{posts?.length ? <div className="live-tasks">{posts.map((post) => <Link className="live-task" key={post.id} href={`/posts/${post.id}`}><div><b>{post.featured ? 'Featured · ' : ''}{post.title}</b><small>{post.status} · {post.view_count} views · comments {post.comments_enabled ? 'on' : 'off'} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</small></div></Link>)}</div> : <div className="empty-state">No posts have been created for this organization yet.</div>}</section></section></main>;
}
