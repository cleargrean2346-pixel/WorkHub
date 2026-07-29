import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createProject, updateProjectStatus } from './actions';

type Project = { id: string; name: string; description: string; status: string; priority: string; start_at: string | null; due_at: string | null };
export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) redirect('/workspace');
  const { data: projectRows } = await supabase.from('projects').select('id,name,description,status,priority,start_at,due_at').eq('organization_id', membership.organization_id).order('created_at', { ascending: false });
  const { data: taskRows } = await supabase.from('work_tasks').select('project_id,status').eq('organization_id', membership.organization_id);
  const projects = (projectRows ?? []) as Project[];
  const tasks = taskRows ?? [];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Projects</strong><small>Plans, progress and deadlines</small></div><Link className="back-link" href="/tasks">Tasks</Link></header><section className="workspace-content"><section className="workspace-panel"><h1>New project</h1><form className="task-form" action={createProject}><input type="hidden" name="organizationId" value={membership.organization_id}/><input name="name" placeholder="Project name" required maxLength={120}/><textarea name="description" placeholder="Goal or summary" maxLength={2000}/><label>Priority<select name="priority" defaultValue="medium"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Start<input name="startAt" type="date"/></label><label>Due<input name="dueAt" type="date"/></label><button className="primary">Create project</button></form></section><section className="workspace-grid">{projects.map((project) => { const linked = tasks.filter((task) => task.project_id === project.id); const done = linked.filter((task) => task.status === 'done').length; return <article className="workspace-panel" key={project.id}><div className="workspace-panel-title"><h2>{project.name}</h2><span>{done}/{linked.length} done</span></div><p>{project.description || 'No summary yet.'}</p><small>{project.priority} priority · {project.start_at || 'No start'} → {project.due_at || 'No deadline'}</small><form className="task-form" action={updateProjectStatus}><input type="hidden" name="id" value={project.id}/><select name="status" defaultValue={project.status}><option value="planned">Planned</option><option value="active">Active</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="archived">Archived</option></select><button className="secondary">Save status</button></form></article>; })}</section></section></main>;
}
