import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { changeMemberRole } from './actions';

type Member = { user_id: string; role: string; status: string; profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null };

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: current } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) return <main className="onboarding"><section className="onboarding-card"><h1>Administrator access required</h1><Link className="primary" href="/workspace">Back to workspace</Link></section></main>;
  const { data: rows } = await supabase.from('organization_members').select('user_id, role, status, profiles(full_name, email)').eq('organization_id', current.organization_id).order('joined_at');
  const members = (rows ?? []) as unknown as Member[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Member management</strong><small>Roles and access</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>Manage member roles</h1><p>Change roles only for approved workspace members.</p></div><section className="workspace-panel"><div className="live-tasks">{members.map((member) => { const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles; return <form className="live-task" action={changeMemberRole} key={member.user_id}><input type="hidden" name="organizationId" value={current.organization_id} /><input type="hidden" name="userId" value={member.user_id} /><div><b>{profile?.full_name || profile?.email || 'Unnamed user'}</b><small>{profile?.email} · {member.status}</small></div><select name="role" defaultValue={member.role} disabled={member.status !== 'approved'}><option value="member">Member</option><option value="team_leader">Team leader</option><option value="manager">Manager</option><option value="organization_admin">Organization admin</option></select><button className="secondary" disabled={member.status !== 'approved'}>Save role</button></form>; })}</div></section></section></main>;
}
