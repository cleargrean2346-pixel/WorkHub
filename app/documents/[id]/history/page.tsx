import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { restoreDocumentVersion } from '@/app/documents/actions';

export default async function DocumentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) redirect('/workspace');
  const [{ data: document }, { data: versions }] = await Promise.all([
    supabase.from('documents').select('id,title,description').eq('id', id).eq('organization_id', membership.organization_id).maybeSingle(),
    supabase.from('document_versions').select('id,version_no,title,description,created_at').eq('document_id', id).eq('organization_id', membership.organization_id).order('version_no', { ascending: false }),
  ]);
  if (!document) notFound();
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>문서 변경 이력</strong><small>{document.title}</small></div><Link className="back-link" href="/documents">문서함</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> HISTORY</p><h1>{document.title}</h1><p>복원해도 현재 상태를 새 버전으로 보관하므로 언제든 다시 되돌릴 수 있습니다.</p></div><section className="workspace-panel"><h2>현재 설명</h2><p>{document.description || '설명 없음'}</p></section><section className="workspace-panel"><div className="workspace-panel-title"><h2>이전 버전</h2><span>{versions?.length ?? 0}</span></div>{versions?.length ? <div className="live-tasks">{versions.map((version) => <div className="live-task" key={version.id}><div><b>버전 {version.version_no} · {version.title}</b><small>{version.description || '설명 없음'} · {new Date(version.created_at).toLocaleString('ko-KR')}</small></div><form action={restoreDocumentVersion}><input type="hidden" name="documentId" value={document.id} /><input type="hidden" name="versionId" value={version.id} /><button className="secondary">이 버전으로 복원</button></form></div>)}</div> : <div className="empty-state">아직 저장된 이전 버전이 없습니다.</div>}</section></section></main>;
}
