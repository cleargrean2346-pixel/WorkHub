import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { markAllNotificationsRead, markNotificationRead } from './actions';

type Notification = { id: string; title: string; body: string; link: string | null; kind: string; read_at: string | null; created_at: string };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string; kind?: string }> }) {
  const { filter = '', kind = '' } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  let query = supabase.from('notifications').select('id,title,body,link,kind,read_at,created_at').eq('user_id', user.id);
  if (filter === 'unread') query = query.is('read_at', null);
  if (kind) query = query.eq('kind', kind);
  const { data: rows } = await query.order('created_at', { ascending: false }).limit(100);
  const notifications = (rows ?? []) as Notification[];
  const unread = notifications.filter((item) => !item.read_at).length;
  const kinds = [...new Set(notifications.map((item) => item.kind))];

  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Notifications</strong><small>{unread} unread</small></div><Link className="back-link" href="/workspace">Workspace</Link></header>
    <section className="workspace-content">
      <div className="workspace-intro"><p className="eyebrow"><span /> ACTIVITY</p><h1>Stay up to date</h1><p><Link href="/settings/notifications">Notification preferences</Link> · <Link href="/me/activity">My activity</Link></p>{unread > 0 && <form action={markAllNotificationsRead}><button className="primary">Mark all as read</button></form>}</div>
      <section className="workspace-panel"><form className="task-form"><select name="filter" defaultValue={filter}><option value="">All notifications</option><option value="unread">Unread only</option></select><select name="kind" defaultValue={kind}><option value="">All types</option>{kinds.map((value) => <option key={value} value={value}>{value}</option>)}</select><button className="secondary">Filter</button></form></section>
      <section className="workspace-panel"><div className="workspace-panel-title"><h2>Notifications</h2><span>{notifications.length}</span></div>{notifications.length ? <div className="live-tasks">{notifications.map((item) => <div className={`live-task ${item.read_at ? 'done' : ''}`} key={item.id}><div><b>{item.title}</b><small>{item.kind} · {item.body} · {new Date(item.created_at).toLocaleString('ko-KR')}</small></div><div className="hero-actions">{item.link && <Link className="secondary" href={item.link}>Open</Link>}{!item.read_at && <form action={markNotificationRead}><input type="hidden" name="id" value={item.id} /><button className="secondary">Mark read</button></form>}</div></div>)}</div> : <div className="empty-state">No notifications match this filter.</div>}</section>
    </section>
  </main>;
}
