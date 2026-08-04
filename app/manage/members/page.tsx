import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { changeMemberRole, removeMember } from './actions';
import styles from './members.module.css';

type SearchParams = Promise<{ q?: string; role?: string }>;
type Member = { user_id: string; role: string; status: string; profiles: { full_name: string | null; email: string | null } | null };

const roles = [
  ['all', '전체'], ['system_admin', '최고관리자'], ['organization_admin', '조직 관리자'],
  ['manager', '매니저'], ['team_leader', '팀 리더'], ['member', '구성원'],
] as const;
const roleLabels = Object.fromEntries(roles.map(([key, value]) => [key, value]));
const statusLabels: Record<string, string> = { approved: '승인됨', pending: '승인 대기', suspended: '탈퇴 처리', unlisted: '승인 대기 등록 필요' };

export default async function MembersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q ?? '').trim().toLowerCase();
  const selectedRole = roles.some(([role]) => role === params.role) ? params.role! : 'all';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Administration is site-wide. Always use the original WorkHub organization
  // instead of an arbitrary old workspace membership returned by the database.
  const { data: primaryOrganization } = await supabase.from('organizations').select('id').order('created_at', { ascending: true }).order('id').limit(1).maybeSingle();
  const { data: current } = primaryOrganization
    ? await supabase.from('organization_members').select('organization_id,role').eq('organization_id', primaryOrganization.id).eq('user_id', user.id).eq('status', 'approved').maybeSingle()
    : { data: null };
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) {
    return <main className="onboarding"><section className="onboarding-card"><h1>관리자 권한이 필요합니다</h1><Link className="primary" href="/">홈으로</Link></section></main>;
  }

  const [{ data: memberRows }, { data: profileRows }] = await Promise.all([
    supabase.from('organization_members').select('user_id,role,status').eq('organization_id', current.organization_id).order('joined_at'),
    // Profiles are global authenticated accounts. Showing this list prevents
    // already-created accounts from disappearing before their pending row exists.
    supabase.from('profiles').select('id,full_name,email').order('created_at'),
  ]);
  const memberships = new Map((memberRows ?? []).map((member) => [member.user_id, member]));
  const members: Member[] = (profileRows ?? []).map((profile) => {
    const membership = memberships.get(profile.id);
    return {
      user_id: profile.id,
      role: membership?.role ?? 'member',
      status: membership?.status ?? 'unlisted',
      profiles: { full_name: profile.full_name, email: profile.email },
    };
  });
  const counts = Object.fromEntries(roles.map(([role]) => [role, role === 'all' ? members.length : members.filter((member) => member.role === role).length]));
  const visible = members.filter((member) => {
    const text = `${member.profiles?.full_name ?? ''} ${member.profiles?.email ?? ''}`.toLowerCase();
    return (selectedRole === 'all' || member.role === selectedRole) && (!query || text.includes(query));
  });

  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>구성원 관리</strong><small>모든 구성원 {members.length}명</small></div><Link className="back-link" href="/manage/dashboard">관리자 페이지</Link></header>
    <section className={`workspace-content ${styles.membersPage}`}>
      <div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>구성원과 권한 관리</h1><p>승인 대기 구성원은 대시보드의 승인 대기에서 처리합니다. 이 화면에서는 모든 구성원의 상태와 권한을 확인할 수 있습니다.</p></div>
      <section className={`workspace-panel ${styles.filters}`}>
        <form action="/manage/members" className={styles.search}><input name="q" defaultValue={params.q ?? ''} placeholder="이름 또는 이메일 검색" aria-label="구성원 검색" /><input type="hidden" name="role" value={selectedRole} /><button className="primary">검색</button>{query && <Link className="secondary" href={`/manage/members?role=${selectedRole}`}>초기화</Link>}</form>
        <nav className={styles.roleTabs} aria-label="권한별 구성원">{roles.map(([role, label]) => <Link key={role} href={`/manage/members?role=${role}${query ? `&q=${encodeURIComponent(params.q ?? '')}` : ''}`} className={selectedRole === role ? styles.active : ''}>{label} <b>{counts[role]}</b></Link>)}</nav>
      </section>
      <section className="workspace-panel"><div className="workspace-panel-title"><div><h2>구성원 목록</h2><p className={styles.helper}>최고관리자 임명은 최고관리자만 할 수 있고, 최고관리자는 본인만 강등할 수 있습니다.</p></div><Link className="secondary" href="/manage/members/pending">승인 대기 관리</Link></div>
        {visible.length ? <div className={styles.memberList}>{visible.map((member) => {
          const name = member.profiles?.full_name || member.profiles?.email || '이름 없는 구성원';
          const targetSystemAdmin = member.role === 'system_admin';
          const maySetSystemAdmin = current.role === 'system_admin';
          // System administrator status is protected by the database as well.
          // The UI never offers a demotion control for a protected account.
          const canEdit = member.status !== 'pending' && member.status !== 'unlisted' && !targetSystemAdmin;
          const canRemove = member.status === 'approved' && !targetSystemAdmin;
          return <div className={styles.memberRow} key={member.user_id}>
            <span className={styles.avatar}>{name.slice(0, 1).toUpperCase()}</span><div className={styles.person}><b>{name}</b><small>{member.profiles?.email || '이메일 없음'} · {statusLabels[member.status] || member.status}</small></div>
            <span className={`${styles.badge} ${targetSystemAdmin ? styles.system : ''}`}>{roleLabels[member.role] || member.role}</span>
            <form action={changeMemberRole} className={styles.roleForm}><input type="hidden" name="organizationId" value={current.organization_id}/><input type="hidden" name="userId" value={member.user_id}/><select name="role" defaultValue={member.role} disabled={!canEdit} aria-label={`${name} 권한`}><option value="member">구성원</option><option value="team_leader">팀 리더</option><option value="manager">매니저</option><option value="organization_admin">조직 관리자</option>{maySetSystemAdmin && <option value="system_admin">최고관리자</option>}</select><button className="secondary" disabled={!canEdit}>{member.status === 'suspended' ? '복구 및 권한 저장' : '권한 저장'}</button></form>
            {canRemove ? <form action={removeMember}><input type="hidden" name="organizationId" value={current.organization_id}/><input type="hidden" name="userId" value={member.user_id}/><button className="secondary">탈퇴 처리</button></form> : <span className={styles.protected}>{member.status === 'pending' ? '승인 대기' : member.status === 'unlisted' ? '자동 등록 대기' : targetSystemAdmin ? '보호됨' : '탈퇴됨'}</span>}
          </div>;
        })}</div> : <div className="empty-state">조건에 맞는 구성원이 없습니다.</div>}
      </section>
    </section>
  </main>;
}
