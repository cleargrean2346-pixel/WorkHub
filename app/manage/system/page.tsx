import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SystemStatusPage() {
  const started = Date.now();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: member } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!member || !['organization_admin', 'system_admin'].includes(member.role)) return <main className="onboarding"><section className="onboarding-card"><h1>관리자 권한이 필요합니다.</h1><Link className="primary" href="/workspace">내 공간</Link></section></main>;
  const [{ error: databaseError }, { count: documents }, { count: auditLogs }] = await Promise.all([
    supabase.from('organizations').select('id').limit(1),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('organization_id', member.organization_id),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('organization_id', member.organization_id),
  ]);
  const latency = Date.now() - started;
  const checks = [
    ['애플리케이션', '정상', 'WorkHub 서버가 응답했습니다.'],
    ['데이터베이스', databaseError ? '확인 필요' : '정상', databaseError ? 'Supabase 연결을 확인하세요.' : `${latency}ms 안에 연결했습니다.`],
    ['문서 저장소', '연결됨', `${documents ?? 0}개의 등록 문서를 관리 중입니다.`],
    ['감사 기록', '연결됨', `${auditLogs ?? 0}건의 운영 기록을 보관 중입니다.`],
  ];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>시스템 상태</strong><small>실시간 운영 점검</small></div><Link className="back-link" href="/manage/dashboard">관리자</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> OPERATIONS</p><h1>운영 상태 점검</h1><p>현재 애플리케이션과 데이터 연결 상태를 확인합니다. 자동 백업 정책은 Supabase 프로젝트의 백업 설정을 함께 확인하세요.</p></div><section className="workspace-grid">{checks.map(([name, state, description]) => <article className="workspace-panel" key={name}><h2>{name}</h2><p>{state}</p><small>{description}</small></article>)}</section><section className="workspace-panel"><div className="workspace-panel-title"><h2>점검 도구</h2><span>운영</span></div><div className="hero-actions"><a className="secondary" href="/api/health" target="_blank" rel="noreferrer">상태 API 열기</a><Link className="secondary" href="/manage/audit">감사 로그 보기</Link><Link className="secondary" href="/documents">문서함 보기</Link></div><p>점검 시각: {new Date().toLocaleString('ko-KR')} · 응답 시간: {latency}ms</p></section></section></main>;
}
