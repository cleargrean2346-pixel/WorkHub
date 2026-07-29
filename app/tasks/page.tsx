import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createTask, setTaskStatus } from '@/app/workspace/actions';

type Task = { id: string; title: string; priority: string; status: 'todo' | 'in_progress' | 'done'; due_at: string | null; labels: string[] | null };
const columns: { key: Task['status']; title: string }[] = [{ key: 'todo', title: 'To do' }, { key: 'in_progress', title: 'In progress' }, { key: 'done', title: 'Done' }];

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) redirect('/workspace');
  const { data: rows } = await supabase.from('work_tasks').select('id,title,priority,status,due_at,labels').eq('organization_id', membership.organization_id).is('archived_at', null).order('created_at', { ascending: false });
  const tasks = (rows ?? []) as Task[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Tasks</strong><small>Kanban board</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> TASKS</p><h1>Plan work and deadlines</h1><p><Link href="/projects">Projects</Link> · <Link href="/calendar">Schedule</Link></p></div><section className="workspace-panel"><form className="task-form" action={createTask}><input type="hidden" name="organizationId" value={membership.organization_id}/><label>Task name<input name="title" required maxLength={200}/></label><label>Due date<input name="dueAt" type="date"/></label><label>Priority<select name="priority" defaultValue="medium"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><button className="primary">Add task</button></form></section><section className="workspace-grid">{columns.map((column) => <section className="workspace-panel" key={column.key}><div className="workspace-panel-title"><h2>{column.title}</h2><span>{tasks.filter((task) => task.status === column.key).length}</span></div><div className="live-tasks">{tasks.filter((task) => task.status === column.key).map((task) => <form action={setTaskStatus} className="live-task" key={task.id}><input type="hidden" name="id" value={task.id}/><div><Link href={`/tasks/${task.id}`}><b>{task.title}</b></Link><small>{task.priority} priority{task.due_at ? ` · due ${new Date(task.due_at).toLocaleDateString('ko-KR')}` : ''}{task.labels?.length ? ` · ${task.labels.join(', ')}` : ''}</small></div><select name="status" defaultValue={task.status}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select><button className="secondary">Move</button></form>)}</div></section>)}</section></section></main>;
}
