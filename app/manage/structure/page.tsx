import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { assignMemberTeam, createDepartment, createTeam } from './actions';

type Department = { id: string; name: string };
type Team = { id: string; name: string; department_id: string | null };
type Member = { user_id: string; team_id: string | null; profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null };

export default async function StructurePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: current } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) return <main className="onboarding"><section className="onboarding-card"><h1>Administrator access required</h1><Link className="primary" href="/workspace">Back to workspace</Link></section></main>;
  const { data: departmentRows } = await supabase.from('departments').select('id, name').eq('organization_id', current.organization_id).order('name');
  const { data: teamRows } = await supabase.from('teams').select('id, name, department_id').eq('organization_id', current.organization_id).order('name');
  const { data: memberRows } = await supabase.from('organization_members').select('user_id, team_id, profiles(full_name, email)').eq('organization_id', current.organization_id).eq('status', 'approved');
  const departments = (departmentRows ?? []) as Department[];
  const teams = (teamRows ?? []) as Team[];
  const members = (memberRows ?? []) as unknown as Member[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Organization structure</strong><small>Departments and teams</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>Organize your teams</h1><p>Create departments, teams, and assign members.</p></div><div className="workspace-grid"><section className="workspace-panel"><h2>Departments</h2><form className="task-form" action={createDepartment}><label htmlFor="department">New department</label><input id="department" name="name" required maxLength={100} /><button className="primary">Add department</button></form><div className="live-tasks">{departments.map((department) => <div className="live-task" key={department.id}><b>{department.name}</b></div>)}</div></section><section className="workspace-panel"><h2>Teams</h2><form className="task-form" action={createTeam}><label htmlFor="team">New team</label><input id="team" name="name" required maxLength={100} /><label htmlFor="departmentId">Department</label><select id="departmentId" name="departmentId"><option value="">No department</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select><button className="primary">Add team</button></form><div className="live-tasks">{teams.map((team) => <div className="live-task" key={team.id}><b>{team.name}</b><small>{departments.find((department) => department.id === team.department_id)?.name || 'No department'}</small></div>)}</div></section></div><section className="workspace-panel"><div className="workspace-panel-title"><h2>Member assignments</h2><span>{members.length}</span></div><div className="live-tasks">{members.map((member) => { const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles; return <form className="live-task" action={assignMemberTeam} key={member.user_id}><input type="hidden" name="userId" value={member.user_id} /><div><b>{profile?.full_name || profile?.email || 'Unnamed user'}</b><small>{profile?.email}</small></div><select name="teamId" defaultValue={member.team_id || ''}><option value="">No team</option>{teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}</select><button className="secondary">Assign</button></form>; })}</div></section></section></main>;
}
