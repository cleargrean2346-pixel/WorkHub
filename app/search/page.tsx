import Link from 'next/link';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';

type Post = { id: string; title: string; excerpt: string | null; body: string; created_at: string };
type Task = { id: string; title: string; status: string; priority: string; due_at: string | null };
type Document = { id: string; title: string; description: string | null; content_type: string | null };

function matches(query: string, ...values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(' ').toLowerCase().includes(query);
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q = '', type = 'all' } = await searchParams;
  const query = q.trim().toLowerCase();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: membership } = user
    ? await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle()
    : { data: null };

  const [{ data: postRows }, taskResult, documentResult] = await Promise.all([
    membership
      ? supabase.from('posts').select('id,title,excerpt,body,created_at').eq('organization_id', membership.organization_id).eq('status', 'published').order('created_at', { ascending: false }).limit(80)
      : supabase.from('posts').select('id,title,excerpt,body,created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(80),
    membership ? supabase.from('work_tasks').select('id,title,status,priority,due_at').eq('organization_id', membership.organization_id).is('archived_at', null).order('created_at', { ascending: false }).limit(80) : Promise.resolve({ data: [] }),
    membership ? supabase.from('documents').select('id,title,description,content_type').eq('organization_id', membership.organization_id).order('created_at', { ascending: false }).limit(80) : Promise.resolve({ data: [] }),
  ]);

  const posts = ((postRows ?? []) as Post[]).filter((item) => !query || matches(query, item.title, item.excerpt, item.body));
  const tasks = ((taskResult.data ?? []) as Task[]).filter((item) => !query || matches(query, item.title, item.priority, item.status));
  const documents = ((documentResult.data ?? []) as Document[]).filter((item) => !query || matches(query, item.title, item.description, item.content_type));
  const total = (type === 'all' || type === 'posts' ? posts.length : 0) + (type === 'all' || type === 'tasks' ? tasks.length : 0) + (type === 'all' || type === 'documents' ? documents.length : 0);

  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>통합 검색</strong><small>{membership ? '워크스페이스 전체' : '공개 게시글'}</small></div><Link className="back-link" href={user ? '/workspace' : '/'}>{user ? '내 공간' : '홈'}</Link></header>
    <section className="workspace-content">
      <div className="workspace-intro"><p className="eyebrow"><span /> SEARCH</p><h1>필요한 정보를 빠르게 찾으세요.</h1><p>게시글, 업무, 문서를 한 번에 검색합니다.</p></div>
      <section className="workspace-panel"><form className="task-form" action="/search"><input name="q" defaultValue={q} placeholder="제목, 내용 또는 키워드 검색" autoFocus /><select name="type" defaultValue={type}><option value="all">전체</option><option value="posts">게시글</option>{membership && <><option value="tasks">업무</option><option value="documents">문서</option></>}</select><button className="primary">검색</button></form></section>
      {query && <p className="workspace-intro"><strong>‘{q}’</strong> 검색 결과 {total}개</p>}
      {(type === 'all' || type === 'posts') && <ResultSection title="게시글" count={posts.length}>{posts.map((item) => <Link className="live-task" key={item.id} href={`/posts/${item.id}`}><div><b>{item.title}</b><small>{item.excerpt || item.body.slice(0, 150) || '내용 없음'}</small><small>{new Date(item.created_at).toLocaleDateString('ko-KR')}</small></div></Link>)}</ResultSection>}
      {membership && (type === 'all' || type === 'tasks') && <ResultSection title="업무" count={tasks.length}>{tasks.map((item) => <Link className="live-task" key={item.id} href={`/tasks/${item.id}`}><div><b>{item.title}</b><small>{item.priority} · {item.status}{item.due_at ? ` · 마감 ${new Date(item.due_at).toLocaleDateString('ko-KR')}` : ''}</small></div></Link>)}</ResultSection>}
      {membership && (type === 'all' || type === 'documents') && <ResultSection title="문서" count={documents.length}>{documents.map((item) => <Link className="live-task" key={item.id} href="/documents"><div><b>{item.title}</b><small>{item.description || item.content_type || '설명 없음'}</small></div></Link>)}</ResultSection>}
      {!total && <section className="workspace-panel"><div className="empty-state">{query ? '일치하는 결과가 없습니다.' : '검색어를 입력해 주세요.'}</div></section>}
    </section>
  </main>;
}

function ResultSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="workspace-panel"><div className="workspace-panel-title"><h2>{title}</h2><span>{count}</span></div>{count ? <div className="live-tasks">{children}</div> : <div className="empty-state">검색 결과가 없습니다.</div>}</section>;
}
