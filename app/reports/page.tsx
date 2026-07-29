import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type Task = { id: string; status: string; priority: string; assignee_id: string | null; due_at: string | null };

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) redirect('/workspace');
  const [{ data: taskRows }, { data: memberRows }] = await Promise.all([
    supabase.from('work_tasks').select('id,status,priority,assignee_id,due_at').eq('organization_id', membership.organization_id).is('archived_at', null),
    supabase.from('organization_members').select('user_id,profiles(full_name,email)').eq('organization_id', membership.organization_id).eq('status', 'approved'),
  ]);
  const tasks = (taskRows ?? []) as Task[];
  const overdue = tasks.filter((task) => task.due_at && new Date(task.due_at) < new Date() && task.status !== 'done');
  const statusCards = [['To do', 'todo'], ['In progress', 'in_progress'], ['Done', 'done']] as const;
  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Work report</strong><small>Team workload at a glance</small></div><Link className="back-link" href="/tasks">Tasks</Link></header>
    <section className="workspace-content">
      <div className="workspace-intro"><p className="eyebrow"><span /> REPORTS</p><h1>See where work stands</h1><p>Live totals are calculated from active tasks in this workspace.</p></div>
      <section className="workspace-grid">{statusCards.map(([label, status]) => <article className="workspace-panel" key={status}><h2>{label}</h2><p>{tasks.filter((task) => task.status === status).length} tasks</p></article>)}<article className="workspace-panel"><h2>Overdue</h2><p>{overdue.length} open tasks</p></article></section>
      <section className="workspace-panel"><div className="workspace-panel-title"><h2>Workload by member</h2><span>{memberRows?.length ?? 0}</span></div>{memberRows?.length ? <div className="live-tasks">{memberRows.map((member: any) => { const name = member.profiles?.full_name || member.profiles?.email || 'Member'; const assigned = tasks.filter((task) => task.assignee_id === member.user_id); return <div className="live-task" key={member.user_id}><div><b>{name}</b><small>{assigned.filter((task) => task.status !== 'done').length} active · {assigned.filter((task) => task.status === 'done').length} done</small></div></div>; })}</div> : <div className="empty-state">No approved members found.</div>}</section>
      {!tasks.length && <section className="workspace-panel empty-state">No active tasks yet. Create a task to populate this report.</section>}
    </section>
  </main>;
}
