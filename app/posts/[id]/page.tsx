import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addComment } from '../actions';

type Comment = { id: string; body: string; created_at: string };

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from('posts').select('id, title, body, status, created_at').eq('id', id).maybeSingle();
  if (!post) notFound();
  const { data: rows } = await supabase.from('comments').select('id, body, created_at').eq('post_id', post.id).order('created_at');
  const comments = (rows ?? []) as Comment[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/posts"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Knowledge</strong><small>{post.status}</small></div><Link href="/posts" className="back-link">All posts</Link></header><section className="workspace-content"><article className="workspace-panel"><p className="eyebrow"><span /> POST</p><h1>{post.title}</h1><p>{new Date(post.created_at).toLocaleDateString('ko-KR')}</p><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.body || 'No content yet.'}</div></article><section className="workspace-panel"><div className="workspace-panel-title"><h2>Comments</h2><span>{comments.length}</span></div><div className="live-tasks">{comments.map((comment) => <div className="live-task" key={comment.id}><div><b>{comment.body}</b><small>{new Date(comment.created_at).toLocaleString('ko-KR')}</small></div></div>)}</div><form className="task-form" action={addComment}><input type="hidden" name="postId" value={post.id} /><label htmlFor="comment">Add a comment</label><textarea id="comment" name="body" required maxLength={5000} rows={4} /><button className="primary">Comment</button></form></section></section></main>;
}
