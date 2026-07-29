import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import styles from './dashboard.module.css';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>관리자 권한이 필요합니다</h1><p>워크스페이스 관리자만 이 화면에 접근할 수 있습니다.</p><Link className="primary" href="/workspace">내 공간으로</Link></section></main>;

  const organizationId = membership.organization_id;
  const [{ count: members }, { count: pending }, { count: posts }, { count: comments }, { count: documents }, { count: tasks }, { data: logs }] = await Promise.all([
    supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'approved'),
    supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'pending'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'published'),
    supabase.from('comments').select('id,posts!inner(organization_id)', { count: 'exact', head: true }).eq('posts.organization_id', organizationId),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('work_tasks').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('audit_logs').select('id,action,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(8),
  ]);

  const cards = [
    ['구성원', members, '승인된 워크스페이스 구성원', '/manage/members'],
    ['승인 대기', pending, '가입 승인을 기다리는 계정', '/manage/members/pending'],
    ['게시글', posts, '현재 공개된 게시글', '/manage/posts'],
    ['댓글', comments, '게시글에 작성된 댓글', '/manage/comments'],
    ['문서', documents, '공유된 워크스페이스 문서', '/documents'],
    ['업무', tasks, '등록된 업무 항목', '/tasks'],
  ];
  const sections = [
    ['Notices', 'Create and publish workspace notices.', '/manage/notices'],
    ['Advertisements', 'Manage advertisement campaigns and placement.', '/manage/ads'],
    ['Analytics', 'Review workspace activity and trends.', '/manage/analytics'],
    ['Audit log', 'Review administrative and system activity.', '/manage/audit'],
    ['Banners', 'Create and publish announcement banners.', '/manage/banners'],
    ['Comments', 'Review and moderate post comments.', '/manage/comments'],
    ['Protected links', 'Create and manage protected access links.', '/manage/protected-links'],
    ['Site settings', 'Manage site-wide workspace settings.', '/manage/site'],
    ['Organization structure', 'Manage teams and organizational structure.', '/manage/structure'],
    ['Categories and tags', 'Manage post categories and tags.', '/manage/taxonomy'],
    ['구성원·권한', '가입 승인과 역할을 관리합니다.', '/manage/members'],
    ['콘텐츠 관리', '게시글과 댓글을 검토합니다.', '/manage/posts'],
    ['공지·배너', '공지, 배너, 광고를 게시합니다.', '/manage/notices'],
    ['분석·감사', '사용 현황과 변경 기록을 확인합니다.', '/manage/analytics'],
    ['사이트 설정', '조직 구조와 사이트 옵션을 변경합니다.', '/manage/site'],
  ];

  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>관리자 페이지</strong><small>워크스페이스 운영 현황과 관리 도구</small></div><Link className="back-link" href="/workspace">내 공간</Link></header>
    <section className={`workspace-content ${styles.dashboard}`}>
      <div className={styles.hero}><div><p className="eyebrow"><span /> ADMINISTRATION</p><h1>관리자 대시보드</h1><p>구성원, 콘텐츠, 운영 정보를 한곳에서 관리하세요.</p></div><div><span className={styles.role}>{membership.role === 'system_admin' ? '최고관리자' : '조직 관리자'}</span><Link className="primary" href="/manage/members">구성원 관리</Link></div></div>
      <section className={styles.cards}>{cards.map(([label, value, description, href]) => <Link className={styles.card} href={href as string} key={label as string}><span>{label}</span><strong>{value ?? 0}</strong><small>{description}</small><i>열기 →</i></Link>)}</section>
      <section className={styles.columns}>
        <section className="workspace-panel"><div className="workspace-panel-title"><div><h2>빠른 관리</h2><p className={styles.panelCopy}>자주 사용하는 관리 도구입니다.</p></div></div><div className={styles.quickLinks}>{sections.map(([label, description, href]) => <Link href={href as string} key={label as string}><b>{label}</b><small>{description}</small><span>→</span></Link>)}</div></section>
        <section className="workspace-panel"><div className="workspace-panel-title"><div><h2>최근 운영 기록</h2><p className={styles.panelCopy}>관리자 동작과 시스템 기록입니다.</p></div><Link href="/manage/audit">전체 보기</Link></div>{logs?.length ? <div className="live-tasks">{logs.map((log) => <div className="live-task" key={log.id}><div><b>{log.action}</b><small>{new Date(log.created_at).toLocaleString('ko-KR')}</small></div></div>)}</div> : <div className="empty-state">아직 기록된 운영 활동이 없습니다.</div>}</section>
      </section>
    </section>
  </main>;
}
