import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createDocumentShare, createFolder, openTrackedDocument, toggleDocumentFavorite, updateDocument } from './actions';

type Doc = { id: string; title: string; storage_path: string; content_type: string | null; size_bytes: number; description: string | null; folder_id: string | null; created_at: string; download_count: number };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; folder?: string; sort?: string; type?: string; favorites?: string }> }) {
  const { q = '', folder = '', sort = 'latest', type = '', favorites = '' } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) redirect('/workspace');
  const [{ data: folders }, { data: rows }, { data: favoritesRows }, { data: recent }] = await Promise.all([
    supabase.from('document_folders').select('id,name').eq('organization_id', membership.organization_id).order('name'),
    supabase.from('documents').select('id,title,storage_path,content_type,size_bytes,description,folder_id,created_at,download_count').eq('organization_id', membership.organization_id).order(sort === 'name' ? 'title' : sort === 'size' ? 'size_bytes' : 'created_at', { ascending: sort === 'name' }),
    supabase.from('document_favorites').select('document_id').eq('user_id', user.id),
    supabase.from('document_access_logs').select('document_id,created_at,documents!inner(id,title)').eq('user_id', user.id).eq('action', 'view').order('created_at', { ascending: false }).limit(5),
  ]);
  const favoriteIds = new Set((favoritesRows ?? []).map((item) => item.document_id));
  let documents = (rows ?? []) as Doc[];
  if (folder) documents = documents.filter((item) => item.folder_id === folder);
  if (type) documents = documents.filter((item) => (item.content_type ?? '').startsWith(type));
  if (favorites === 'yes') documents = documents.filter((item) => favoriteIds.has(item.id));
  if (q) documents = documents.filter((item) => `${item.title} ${item.description ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const admin = ['organization_admin', 'system_admin'].includes(membership.role);

  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>문서함</strong><small>{documents.length}개 문서</small></div><Link className="back-link" href="/workspace">내 공간</Link></header><section className="workspace-content">
    <div className="workspace-intro"><p className="eyebrow"><span /> DOCUMENTS</p><h1>팀 문서를 안전하게 관리하세요.</h1><p>폴더, 즐겨찾기, 검색, 공유 링크와 변경 이력을 지원합니다.</p></div>
    {admin && <section className="workspace-panel"><form className="task-form" action={createFolder}><input name="name" placeholder="새 폴더 이름" required /><button className="primary">폴더 만들기</button></form></section>}
    <section className="workspace-panel"><form className="task-form"><input name="q" defaultValue={q} placeholder="문서 검색" /><select name="folder" defaultValue={folder}><option value="">모든 폴더</option>{(folders ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select name="type" defaultValue={type}><option value="">모든 형식</option><option value="application/">문서</option><option value="image/">이미지</option><option value="text/">텍스트</option></select><select name="sort" defaultValue={sort}><option value="latest">최신순</option><option value="name">이름순</option><option value="size">용량순</option></select><label><input type="checkbox" name="favorites" value="yes" defaultChecked={favorites === 'yes'} /> 즐겨찾기만</label><button className="primary">적용</button></form></section>
    <section className="workspace-panel"><div className="workspace-panel-title"><h2>최근 열어본 문서</h2><span>{recent?.length ?? 0}</span></div>{recent?.length ? <div className="live-tasks">{recent.map((item: any) => <p key={`${item.document_id}-${item.created_at}`}>{item.documents?.title}</p>)}</div> : <div className="empty-state">최근 열어본 문서가 없습니다.</div>}</section>
    <section className="workspace-panel"><div className="workspace-panel-title"><h2>문서</h2><span>{documents.length}</span></div>{documents.length ? <div className="live-tasks">{documents.map((document) => <div className="live-task" key={document.id}><div><b>{favoriteIds.has(document.id) ? '★ ' : ''}{document.title}</b><small>{document.content_type || '알 수 없는 형식'} · {(document.size_bytes / 1024).toFixed(1)} KB · 다운로드 {document.download_count}</small>{document.description && <small>{document.description}</small>}</div><div className="hero-actions"><form action={toggleDocumentFavorite}><input type="hidden" name="id" value={document.id} /><button className="secondary">{favoriteIds.has(document.id) ? '즐겨찾기 해제' : '즐겨찾기'}</button></form><form action={openTrackedDocument}><input type="hidden" name="id" value={document.id} /><input type="hidden" name="storagePath" value={document.storage_path} /><button className="secondary">열기</button></form><Link className="secondary" href={`/documents/${document.id}/history`}>변경 이력</Link><form action={createDocumentShare}><input type="hidden" name="id" value={document.id} /><input name="expiresAt" type="datetime-local" /><button className="secondary">공유</button></form><form action={updateDocument}><input type="hidden" name="id" value={document.id} /><select name="folderId" defaultValue={document.folder_id || ''}><option value="">폴더 없음</option>{(folders ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="description" defaultValue={document.description ?? ''} placeholder="문서 설명" maxLength={500} /><button className="secondary">저장</button></form></div></div>)}</div> : <div className="empty-state">조건에 맞는 문서가 없습니다. 내 공간에서 문서를 업로드해 보세요.</div>}</section>
  </section></main>;
}
