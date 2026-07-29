import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>Administrator access required</h1><Link className="primary" href="/workspace">Workspace</Link></section></main>;
  const organizationId = membership.organization_id;
  const [{ count: members }, { count: pending }, { count: posts }, { count: comments }, { count: documents }, { count: tasks }, { data: logs }] = await Promise.all([
    supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'approved'),
    supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'pending'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'published'),
    supabase.from('comments').select('id,posts!inner(organization_id)', { count: 'exact', head: true }).eq('posts.organization_id', organizationId),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('work_tasks').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('audit_logs').select('id,action,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(8),
  ]);
  const cards = [['Members', members], ['Pending approvals', pending], ['Published posts', posts], ['Comments', comments], ['Documents', documents], ['Tasks', tasks]];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Admin dashboard</strong><small>Workspace operations overview</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ADMINISTRATION</p><h1>Workspace operations</h1><p>Live counts and recent administrative activity for this organization.</p></div><section className="workspace-grid">{cards.map(([label, value]) => <article className="workspace-panel" key={String(label)}><h2>{label}</h2><p>{value ?? 0}</p></article>)}</section><section className="workspace-panel"><div className="workspace-panel-title"><h2>Recent operations</h2><Link href="/manage/audit">View audit log</Link></div>{logs?.length ? <div className="live-tasks">{logs.map((log) => <div className="live-task" key={log.id}><div><b>{log.action}</b><small>{new Date(log.created_at).toLocaleString('ko-KR')}</small></div></div>)}</div> : <div className="empty-state">No administrative activity recorded yet.</div>}</section><section className="hero-actions"><Link className="primary" href="/manage/analytics">Analytics</Link><Link className="secondary" href="/manage/members">Members</Link><Link className="secondary" href="/manage/posts">Posts</Link><Link className="secondary" href="/manage/site">Site settings</Link></section></section></main>;
}
