import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type Post = { id: string; title: string; status: string; created_at: string };

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url, email').eq('id', user.id).maybeSingle();
  const { data: postRows } = await supabase.from('posts').select('id, title, status, created_at').eq('author_id', user.id).order('created_at', { ascending: false }).limit(20);
  const { data: bookmarkRows } = await supabase.from('bookmarks').select('post_id, posts(id, title, status, created_at)').eq('user_id', user.id).limit(20);
  const posts = (postRows ?? []) as Post[];
  const bookmarks = (bookmarkRows ?? []).map((row) => Array.isArray(row.posts) ? row.posts[0] : row.posts).filter(Boolean) as Post[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>My page</strong><small>{profile?.email || user.email}</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> MY PAGE</p>{profile?.avatar_url && <img src={profile.avatar_url} alt="Profile" width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover' }} />}<h1>{profile?.full_name || 'My account'}</h1><Link className="primary" href="/settings/profile">Edit profile</Link></div><div className="workspace-grid"><section className="workspace-panel"><div className="workspace-panel-title"><h2>My posts</h2><span>{posts.length}</span></div>{posts.length ? <div className="live-tasks">{posts.map((post) => <Link className="live-task" href={`/posts/${post.id}`} key={post.id}><div><b>{post.title}</b><small>{post.status} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</small></div></Link>)}</div> : <div className="empty-state">You have not written any posts.</div>}</section><section className="workspace-panel"><div className="workspace-panel-title"><h2>Bookmarks</h2><span>{bookmarks.length}</span></div>{bookmarks.length ? <div className="live-tasks">{bookmarks.map((post) => <Link className="live-task" href={`/posts/${post.id}`} key={post.id}><div><b>{post.title}</b><small>{post.status} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</small></div></Link>)}</div> : <div className="empty-state">No bookmarks yet.</div>}</section></div></section></main>;
}
