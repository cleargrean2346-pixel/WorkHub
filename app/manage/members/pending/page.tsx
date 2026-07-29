import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { approveMember, rejectMember } from '../actions';

type PendingMember = { user_id: string; role: string; invited_at: string | null; profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null };

export default async function PendingMembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: current } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) redirect('/workspace');
  const { data: rows } = await supabase.from('organization_members').select('user_id,role,invited_at,profiles(full_name)').eq('organization_id', current.organization_id).eq('status', 'pending').order('invited_at', { ascending: false });
  const pendingMembers = (rows ?? []) as unknown as PendingMember[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>승인 대기 관리</strong><small>{pendingMembers.length}명의 가입 요청</small></div><Link className="back-link" href="/manage/members">구성원 관리</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>가입 요청 검토</h1><p>승인하면 구성원 목록에 추가되고, 반려하면 워크스페이스 접근이 중지됩니다.</p></div><section className="workspace-panel"><div className="workspace-panel-title"><h2>승인 대기</h2><span>{pendingMembers.length}</span></div>{pendingMembers.length ? <div className="live-tasks">{pendingMembers.map((member) => { const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles; const name = profile?.full_name || profile?.email || '이름 없는 계정'; return <div className="live-task" key={member.user_id}><div><b>{name}</b><small>{profile?.email || '이메일 없음'} · 요청 {member.invited_at ? new Date(member.invited_at).toLocaleString('ko-KR') : '날짜 정보 없음'}</small></div><div className="hero-actions"><form action={approveMember}><input type="hidden" name="organizationId" value={current.organization_id}/><input type="hidden" name="userId" value={member.user_id}/><button className="primary">승인</button></form><form action={rejectMember}><input type="hidden" name="organizationId" value={current.organization_id}/><input type="hidden" name="userId" value={member.user_id}/><button className="secondary">반려</button></form></div></div>; })}</div> : <div className="empty-state">검토할 가입 요청이 없습니다.</div>}</section></section></main>;
}
