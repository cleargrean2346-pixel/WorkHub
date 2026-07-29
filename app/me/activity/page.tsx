import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function MyActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: posts }, { data: comments }, { data: tasks }, { data: notifications }] = await Promise.all([
    supabase.from('posts').select('id,title,status,created_at').eq('author_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('comments').select('id,body,created_at').eq('author_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('work_tasks').select('id,title,status,created_at').or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(10),
    supabase.from('notifications').select('id,title,created_at,read_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ]);
  const unread = (notifications ?? []).filter((item) => !item.read_at).length;
  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>My activity</strong><small>Recent work and updates</small></div><Link className="back-link" href="/me">My page</Link></header>
    <section className="workspace-content">
      <div className="workspace-intro"><p className="eyebrow"><span /> ACTIVITY</p><h1>Your recent work</h1><p>Review what you have shared, discussed, and been assigned.</p></div>
      <section className="workspace-grid">{[['Posts', posts?.length ?? 0, '/posts'], ['Comments', comments?.length ?? 0, '/me/activity'], ['Tasks', tasks?.length ?? 0, '/tasks'], ['Unread alerts', unread, '/notifications']].map(([label, count, href]) => <Link className="workspace-panel" href={href as string} key={label as string}><h2>{label}</h2><p>{count} recent</p></Link>)}</section>
      <section className="workspace-grid">
        <section className="workspace-panel"><div className="workspace-panel-title"><h2>Recent posts</h2><Link href="/posts">View all</Link></div>{posts?.length ? <div className="live-tasks">{posts.map((post) => <Link className="live-task" key={post.id} href={`/posts/${post.id}`}><div><b>{post.title}</b><small>{post.status} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</small></div></Link>)}</div> : <div className="empty-state">No posts yet.</div>}</section>
        <section className="workspace-panel"><div className="workspace-panel-title"><h2>Recent tasks</h2><Link href="/tasks">View all</Link></div>{tasks?.length ? <div className="live-tasks">{tasks.map((task) => <Link className="live-task" key={task.id} href={`/tasks/${task.id}`}><div><b>{task.title}</b><small>{task.status} · {new Date(task.created_at).toLocaleDateString('ko-KR')}</small></div></Link>)}</div> : <div className="empty-state">No tasks assigned to you yet.</div>}</section>
      </section>
    </section>
  </main>;
}
