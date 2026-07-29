import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TaskAutomationPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle(); if (!membership) redirect('/workspace');
  const { data: tasks } = await supabase.from('work_tasks').select('id,title,recurrence,reminder_at,due_at,status').eq('organization_id', membership.organization_id).is('archived_at', null).not('recurrence','is',null).order('due_at');
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Task automation</strong><small>Recurring work and reminders</small></div><Link className="back-link" href="/tasks">Tasks</Link></header><section className="workspace-content"><section className="workspace-panel"><h1>Recurring tasks</h1><p>Completing a recurring task creates the next task automatically.</p><div className="live-tasks">{(tasks ?? []).map((task) => <Link className="live-task" href={`/tasks/${task.id}`} key={task.id}><div><b>{task.title}</b><small>{task.recurrence} · due {task.due_at || 'not set'} · reminder {task.reminder_at ? new Date(task.reminder_at).toLocaleString('ko-KR') : 'not set'} · {task.status}</small></div></Link>)}</div></section></section></main>;
}
