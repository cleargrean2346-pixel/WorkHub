import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createProtectedLink, setProtectedLinkEnabled } from './actions';

type ProtectedLink = { id: string; post_id: string; original_url: string; protected_token: string; enabled: boolean; posts: { title: string } | { title: string }[] | null };

export default async function ProtectedLinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>관리자 권한이 필요합니다</h1><Link className="primary" href="/workspace">내 공간으로</Link></section></main>;
  const [{ data: posts }, { data: rows }] = await Promise.all([
    supabase.from('posts').select('id,title').eq('organization_id', membership.organization_id).order('created_at', { ascending: false }),
    supabase.from('protected_urls').select('id,post_id,original_url,protected_token,enabled,posts(title)').order('created_at', { ascending: false }),
  ]);
  const links = (rows ?? []) as unknown as ProtectedLink[];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://work-hub-ashen.vercel.app';
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>보호 링크</strong><small>보안 링크 {links.length}개</small></div><Link className="back-link" href="/manage/dashboard">관리자</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> 관리자</p><h1>외부 링크 보호</h1><p>링크의 실제 주소는 구성원 권한을 확인한 뒤 서버에서만 열립니다.</p></div><section className="workspace-panel"><form className="task-form" action={createProtectedLink}><select name="postId" required><option value="">연결할 게시글 선택</option>{(posts ?? []).map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}</select><input name="originalUrl" type="url" placeholder="https://example.com/private-resource" required /><button className="primary">보호 링크 만들기</button></form></section><section className="workspace-panel"><div className="workspace-panel-title"><h2>생성된 링크</h2><span>{links.length}</span></div>{links.length ? <div className="live-tasks">{links.map((link) => { const post = Array.isArray(link.posts) ? link.posts[0] : link.posts; return <div className="live-task" key={link.id}><div><b>{post?.title || '게시글'}</b><small>{appUrl}/go/{link.protected_token} · {link.enabled ? '사용 중' : '중지됨'}</small></div><form action={setProtectedLinkEnabled}><input type="hidden" name="id" value={link.id} /><input type="hidden" name="enabled" value={String(!link.enabled)} /><button className="secondary">{link.enabled ? '중지' : '사용'}</button></form></div>; })}</div> : <div className="empty-state">아직 생성된 보호 링크가 없습니다.</div>}</section></section></main>;
}
