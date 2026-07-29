import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { approveMember, changeMemberRole } from './actions';
import styles from './members.module.css';

type Member = { user_id: string; role: string; status: string; profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null };
type SearchParams = Promise<{ q?: string; role?: string }>;

const roles = [
  ['all', '전체'],
  ['system_admin', '최고관리자'],
  ['organization_admin', '조직 관리자'],
  ['manager', '매니저'],
  ['team_leader', '팀 리더'],
  ['member', '구성원'],
] as const;

const roleLabels: Record<string, string> = Object.fromEntries(roles.map(([value, label]) => [value, label]));

export default async function MembersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q ?? '').trim().toLowerCase();
  const selectedRole = roles.some(([role]) => role === params.role) ? params.role! : 'all';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: current } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) return <main className="onboarding"><section className="onboarding-card"><h1>관리자 권한이 필요합니다</h1><Link className="primary" href="/workspace">내 공간으로</Link></section></main>;

  const { data: memberRows } = await supabase.from('organization_members').select('user_id,role,status').eq('organization_id', current.organization_id).eq('status', 'approved').order('joined_at');
  const baseMembers = memberRows?.length ? memberRows : [{ user_id: user.id, role: current.role, status: 'approved' }];
  const { data: profileRows } = await supabase.from('profiles').select('id,full_name,email').in('id', baseMembers.map((member) => member.user_id));
  const profilesById = new Map((profileRows ?? []).map((profile) => [profile.id, { full_name: profile.full_name, email: profile.email }]));
  const members = baseMembers.map((member) => ({ ...member, profiles: profilesById.get(member.user_id) ?? null })) as Member[];
  const countByRole = Object.fromEntries(roles.map(([role]) => [role, role === 'all' ? members.length : members.filter((member) => member.role === role).length]));
  const visibleMembers = members.filter((member) => {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    const haystack = `${profile?.full_name ?? ''} ${profile?.email ?? ''}`.toLowerCase();
    return matchesRole && (!query || haystack.includes(query));
  });

  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>구성원 관리</strong><small>{members.length}명의 워크스페이스 구성원</small></div><Link className="back-link" href="/manage/dashboard">관리자 페이지</Link></header>
    <section className={`workspace-content ${styles.membersPage}`}>
      <div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>구성원과 권한 관리</h1><p>이름 또는 이메일로 찾고, 역할별로 나누어 권한을 부여하거나 변경할 수 있습니다.</p></div>
      <section className={`workspace-panel ${styles.filters}`}>
        <form action="/manage/members" className={styles.search}><input name="q" defaultValue={params.q ?? ''} placeholder="이름 또는 이메일 검색" aria-label="구성원 검색" /><input type="hidden" name="role" value={selectedRole} /><button className="primary">검색</button>{query && <Link className="secondary" href={`/manage/members?role=${selectedRole}`}>초기화</Link>}</form>
        <nav className={styles.roleTabs} aria-label="권한별 구성원"><Link href="/manage/members" className={selectedRole === 'all' ? styles.active : ''}>전체 <b>{countByRole.all}</b></Link>{roles.slice(1).map(([role, label]) => <Link href={`/manage/members?role=${role}${query ? `&q=${encodeURIComponent(params.q ?? '')}` : ''}`} className={selectedRole === role ? styles.active : ''} key={role}>{label} <b>{countByRole[role]}</b></Link>)}</nav>
      </section>
      <section className="workspace-panel"><div className="workspace-panel-title"><div><h2>구성원 목록</h2><p className={styles.helper}>{visibleMembers.length}명 표시 · 최고관리자는 강등 또는 변경할 수 없습니다.</p></div><span>{selectedRole === 'all' ? '전체' : roleLabels[selectedRole]}</span></div>{visibleMembers.length ? <div className={styles.memberList}>{visibleMembers.map((member) => { const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles; const locked = member.role === 'system_admin'; const pending = member.status === 'pending'; const name = profile?.full_name || profile?.email || '이름 없는 구성원'; return <form className={styles.memberRow} action={pending ? approveMember : changeMemberRole} key={member.user_id}><input type="hidden" name="organizationId" value={current.organization_id}/><input type="hidden" name="userId" value={member.user_id}/><span className={styles.avatar}>{name.slice(0, 1).toUpperCase()}</span><div className={styles.person}><b>{name}</b><small>{profile?.email || '이메일 없음'} · {member.status === 'approved' ? '승인됨' : pending ? '승인 대기' : '정지됨'}</small></div><span className={`${styles.badge} ${locked ? styles.system : ''}`}>{roleLabels[member.role] || member.role}</span><select name="role" defaultValue={member.role} disabled={member.status !== 'approved' || locked} aria-label={`${name}의 역할`}><option value="member">구성원</option><option value="team_leader">팀 리더</option><option value="manager">매니저</option><option value="organization_admin">조직 관리자</option></select><button className="secondary" disabled={locked || member.status === 'suspended'}>{locked ? '보호됨' : pending ? '승인하기' : '권한 저장'}</button></form>; })}</div> : <div className="empty-state">조건에 맞는 구성원이 없습니다.</div>}</section>
    </section>
  </main>;
}
