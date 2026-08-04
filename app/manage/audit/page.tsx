import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type AuditLog = { id: string; action: string; target_type: string | null; target_id: string | null; details: Record<string, unknown> | null; created_at: string };

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; days?: string }> }) {
  const { q = '', action = '', days = '30' } = await searchParams;
  const period = ['7', '30', '90', 'all'].includes(days) ? days : '30';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>관리자 권한이 필요합니다.</h1><Link className="primary" href="/workspace">내 공간</Link></section></main>;
  let query = supabase.from('audit_logs').select('id,action,target_type,target_id,details,created_at').eq('organization_id', membership.organization_id);
  if (period !== 'all') query = query.gte('created_at', new Date(Date.now() - Number(period) * 86400000).toISOString());
  const { data: rows } = await query.order('created_at', { ascending: false }).limit(500);
  let logs = (rows ?? []) as AuditLog[];
  const actions = [...new Set(logs.map((item) => item.action))].sort();
  if (action) logs = logs.filter((item) => item.action === action);
  if (q) { const needle = q.toLowerCase(); logs = logs.filter((item) => `${item.action} ${item.target_type ?? ''} ${item.target_id ?? ''} ${JSON.stringify(item.details ?? {})}`.toLowerCase().includes(needle)); }
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>감사 로그</strong><small>{logs.length}개 기록</small></div><Link className="back-link" href="/manage/dashboard">관리자</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>운영 변경 기록</h1><p>권한, 게시물, 공지 등 관리자 작업의 최근 기록을 조회합니다.</p></div><section className="workspace-panel"><form className="task-form"><input name="q" defaultValue={q} placeholder="작업 또는 대상 검색" /><select name="action" defaultValue={action}><option value="">모든 작업</option>{actions.map((item) => <option key={item} value={item}>{item}</option>)}</select><select name="days" defaultValue={period}><option value="7">최근 7일</option><option value="30">최근 30일</option><option value="90">최근 90일</option><option value="all">전체</option></select><button className="primary">조회</button></form></section><section className="workspace-panel"><div className="workspace-panel-title"><h2>감사 로그</h2><span>{logs.length}</span></div>{logs.length ? <div className="live-tasks">{logs.map((log) => <div className="live-task" key={log.id}><div><b>{log.action}</b><small>{log.target_type || '시스템'}{log.target_id ? ` · ${log.target_id}` : ''} · {new Date(log.created_at).toLocaleString('ko-KR')}</small>{log.details && <small>{Object.entries(log.details).map(([key, value]) => `${key}: ${String(value)}`).join(' · ')}</small>}</div></div>)}</div> : <div className="empty-state">조건에 맞는 감사 기록이 없습니다.</div>}</section></section></main>;
}
