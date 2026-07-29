import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { markAllNotificationsRead, markNotificationRead } from './actions';

type Notification = { id: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: rows } = await supabase.from('notifications').select('id, title, body, link, read_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  const notifications = (rows ?? []) as Notification[];
  const unread = notifications.filter((item) => !item.read_at).length;
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Notifications</strong><small>{unread} unread</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> NOTIFICATIONS</p><h1>Stay up to date</h1><p>Approvals, comments, and workspace activity appear here.</p><form action={markAllNotificationsRead}><button className="primary">Mark all as read</button></form></div><section className="workspace-panel">{notifications.length ? <div className="live-tasks">{notifications.map((notification) => <div className={`live-task ${notification.read_at ? 'done' : ''}`} key={notification.id}><div><b>{notification.title}</b><small>{notification.body} · {new Date(notification.created_at).toLocaleString('ko-KR')}</small></div>{notification.link && <Link className="secondary" href={notification.link}>Open</Link>}{!notification.read_at && <form action={markNotificationRead}><input type="hidden" name="id" value={notification.id} /><button className="secondary">Read</button></form>}</div>)}</div> : <div className="empty-state">No notifications yet.</div>}</section></section></main>;
}
