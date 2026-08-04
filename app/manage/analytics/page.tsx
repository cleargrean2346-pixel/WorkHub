import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type ListProps = { title: string; items: [string, number][] };
function MetricList({ title, items }: ListProps) { return <section className="workspace-panel"><h2>{title}</h2>{items.length ? <div className="live-tasks">{items.map(([label, count]) => <div className="live-task" key={label}><div><b>{label}</b><small>{count.toLocaleString('ko-KR')}건</small></div></div>)}</div> : <div className="empty-state">선택한 기간의 데이터가 없습니다.</div>}</section>; }

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: raw = '30' } = await searchParams;
  const days = ['7', '30', '90'].includes(raw) ? Number(raw) : 30;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: member } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!member || !['organization_admin', 'system_admin'].includes(member.role)) return <main className="onboarding"><section className="onboarding-card"><h1>관리자 권한이 필요합니다.</h1><Link className="primary" href="/workspace">내 공간</Link></section></main>;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [{ data: views }, { data: posts }, { data: ads }, { data: events }] = await Promise.all([
    supabase.from('page_views').select('id,path,created_at').eq('organization_id', member.organization_id).gte('created_at', since),
    supabase.from('posts').select('id,title,view_count').eq('organization_id', member.organization_id).order('view_count', { ascending: false }).limit(10),
    supabase.from('advertisements').select('id,title,click_count').eq('organization_id', member.organization_id).order('click_count', { ascending: false }).limit(10),
    supabase.from('ad_events').select('advertisement_id,event_type').eq('organization_id', member.organization_id).gte('created_at', since),
  ]);
  const paths = new Map<string, number>(), daily = new Map<string, number>();
  (views ?? []).forEach((view) => { paths.set(view.path, (paths.get(view.path) ?? 0) + 1); const date = view.created_at.slice(0, 10); daily.set(date, (daily.get(date) ?? 0) + 1); });
  const impressions = (events ?? []).filter((event) => event.event_type === 'impression').length;
  const clicks = (events ?? []).filter((event) => event.event_type === 'click').length;
  const metrics: [string, string | number][] = [['페이지 조회', views?.length ?? 0], ['광고 노출', impressions], ['광고 클릭', clicks], ['클릭률', impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : '0%']];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>분석</strong><small>최근 {days}일</small></div><Link className="back-link" href="/manage/dashboard">관리자</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>워크스페이스 분석</h1><p>방문 흐름, 인기 게시글, 광고 활동을 기간별로 확인합니다.</p></div><section className="workspace-panel"><form className="task-form"><label>기간<select name="days" defaultValue={String(days)}><option value="7">최근 7일</option><option value="30">최근 30일</option><option value="90">최근 90일</option></select></label><button className="primary">기간 적용</button></form></section><section className="workspace-grid">{metrics.map(([label, value]) => <article className="workspace-panel" key={label}><h2>{label}</h2><p>{value}</p></article>)}</section><section className="workspace-grid"><MetricList title="인기 경로" items={[...paths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)} /><MetricList title="일별 방문" items={[...daily.entries()].sort()} /><MetricList title="인기 게시글" items={(posts ?? []).map((post) => [post.title, post.view_count] as [string, number])} /><MetricList title="광고 클릭" items={(ads ?? []).map((ad) => [ad.title, ad.click_count] as [string, number])} /></section></section></main>;
}
