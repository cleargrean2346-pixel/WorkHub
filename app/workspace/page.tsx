import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { approveMember, createOrganization, createTask, inviteMember, setTaskStatus } from './actions';
import './workspace.css';

type Membership = { organization_id: string; role: string; status: 'pending' | 'approved' | 'suspended' };
type Task = { id: string; title: string; priority: string; status: string };
type Member = { user_id: string; role: string; status: string; profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null };

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membershipRows } = await supabase.from('organization_members').select('organization_id, role, status').eq('user_id', user.id);
  const memberships = (membershipRows ?? []) as Membership[];
  const pendingMembership = memberships.find((membership) => membership.status === 'pending');
  const approvedMembership = memberships.find((membership) => membership.status === 'approved');

  if (!approvedMembership && pendingMembership) {
    return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> WAITING FOR APPROVAL</p><h1>관리자 승인을 기다리고 있어요</h1><p>관리자가 워크스페이스 가입을 승인하면 이 화면에서 업무공간을 바로 사용할 수 있습니다.</p><Link className="primary" href="/">메인으로 돌아가기</Link></section></main>;
  }

  if (!approvedMembership) {
    return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> WELCOME</p><h1>첫 워크스페이스를 만드세요</h1><p>조직의 업무와 팀원을 한곳에서 관리할 수 있습니다.</p><form action={createOrganization}><label htmlFor="name">조직 이름</label><input id="name" name="name" placeholder="예: Jupiter Labs" required maxLength={80} /><button className="primary">워크스페이스 만들기</button></form></section></main>;
  }

  const { data: organization } = await supabase.from('organizations').select('id, name').eq('id', approvedMembership.organization_id).single();
  if (!organization) return null;
  const { data: taskRows } = await supabase.from('work_tasks').select('id, title, priority, status').eq('organization_id', organization.id).order('created_at', { ascending: false }).limit(30);
  const tasks = (taskRows ?? []) as Task[];
  const isAdmin = ['organization_admin', 'system_admin'].includes(approvedMembership.role);
  const { data: memberRows } = isAdmin ? await supabase.from('organization_members').select('user_id, role, status, profiles(full_name, email)').eq('organization_id', organization.id).order('joined_at') : { data: [] };
  const members = (memberRows ?? []) as unknown as Member[];
  const pending = tasks.filter((task) => task.status !== 'done').length;

  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>{organization.name}</strong><small>내 워크스페이스</small></div><Link href="/" className="back-link">대시보드로 돌아가기</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> YOUR WORKSPACE</p><h1>업무를 한곳에서 관리하세요</h1><p>미완료 작업 <b>{pending}</b>개가 있습니다.</p></div><div className="workspace-grid"><section className="workspace-panel"><h2>새 작업</h2><form className="task-form" action={createTask}><input type="hidden" name="organizationId" value={organization.id} /><label htmlFor="task-title">작업 이름</label><input id="task-title" name="title" placeholder="무엇을 해야 하나요?" required maxLength={200} /><label htmlFor="priority">우선순위</label><select id="priority" name="priority" defaultValue="medium"><option value="high">높음</option><option value="medium">보통</option><option value="low">낮음</option></select><button className="primary">작업 추가</button></form></section><section className="workspace-panel"><div className="workspace-panel-title"><h2>작업 목록</h2><span>{tasks.length}개</span></div>{tasks.length ? <div className="live-tasks">{tasks.map((task) => <form action={setTaskStatus} className={`live-task ${task.status === 'done' ? 'done' : ''}`} key={task.id}><input type="hidden" name="id" value={task.id} /><input type="hidden" name="status" value={task.status === 'done' ? 'todo' : 'done'} /><button aria-label={`${task.title} 완료 상태 변경`} className="task-toggle">{task.status === 'done' ? '✓' : ''}</button><div><b>{task.title}</b><small>{task.priority === 'high' ? '높음' : task.priority === 'low' ? '낮음' : '보통'} 우선순위</small></div></form>)}</div> : <div className="empty-state">아직 작업이 없습니다. 첫 작업을 만들어 보세요.</div>}</section></div>{isAdmin && <section className="workspace-panel"><div className="workspace-panel-title"><div><h2>팀원 승인 관리</h2><p>초대된 팀원을 확인하고 승인합니다.</p></div></div><form className="task-form" action={inviteMember}><input type="hidden" name="organizationId" value={organization.id} /><label htmlFor="member-email">팀원 이메일</label><input id="member-email" name="email" type="email" placeholder="team@example.com" required /><button className="primary">승인 대기에 추가</button></form><div className="live-tasks">{members.map((member) => { const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles; return <div className="live-task" key={member.user_id}><div><b>{profile?.full_name || profile?.email || '이름 없는 사용자'}</b><small>{profile?.email} · {member.role} · {member.status === 'pending' ? '승인 대기' : '승인됨'}</small></div>{member.status === 'pending' && <form action={approveMember}><input type="hidden" name="organizationId" value={organization.id} /><input type="hidden" name="userId" value={member.user_id} /><button className="primary">승인</button></form>}</div>; })}</div></section>}</section></main>;
}
