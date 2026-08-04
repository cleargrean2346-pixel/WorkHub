import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { moderateComment } from './actions';

type CommentRow = { id: string; body: string; created_at: string; posts: { title: string } | { title: string }[] | null };

export default async function ManageCommentsPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>관리자 권한이 필요합니다</h1><Link className="primary" href="/workspace">내 공간</Link></section></main>;
  const { data: rows } = await supabase.from('comments').select('id,body,created_at,posts!inner(title,organization_id)').eq('posts.organization_id', membership.organization_id).order('created_at', { ascending: false }).limit(100);
  const comments = (rows ?? []) as unknown as CommentRow[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>댓글 관리</strong><small>최근 댓글 {comments.length}개</small></div><Link className="back-link" href="/manage/dashboard">관리자</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> 관리자</p><h1>댓글을 검토하세요.</h1><p>부적절한 댓글은 삭제할 수 있으며 삭제된 댓글은 복구되지 않습니다.</p></div><section className="workspace-panel"><div className="workspace-panel-title"><h2>최근 댓글</h2><span>{comments.length}</span></div>{comments.length ? <div className="live-tasks">{comments.map((comment) => { const post = Array.isArray(comment.posts) ? comment.posts[0] : comment.posts; return <div className="live-task" key={comment.id}><div><b>{post?.title || '게시글'}</b><small>{comment.body} · {new Date(comment.created_at).toLocaleString('ko-KR')}</small></div><form action={moderateComment}><input type="hidden" name="id" value={comment.id} /><button className="secondary">삭제</button></form></div>; })}</div> : <div className="empty-state">검토할 댓글이 없습니다.</div>}</section></section></main>;
}
