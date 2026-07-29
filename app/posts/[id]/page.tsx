import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addComment, deleteComment, deletePost, toggleBookmark, toggleLike, updateComment } from '../actions';

type Comment = { id: string; body: string; created_at: string; author_id: string };

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: post } = await supabase.from('posts').select('id, title, body, status, created_at, author_id, view_count').eq('id', id).maybeSingle();
  if (!post) notFound();
  await supabase.rpc('increment_post_views', { target_post_id: post.id });
  const { data: rows } = await supabase.from('comments').select('id, body, created_at, author_id').eq('post_id', post.id).order('created_at');
  const { data: likes } = await supabase.from('likes').select('user_id').eq('post_id', post.id);
  const { data: bookmark } = user ? await supabase.from('bookmarks').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle() : { data: null };
  const comments = (rows ?? []) as Comment[];
  const liked = Boolean(user && likes?.some((like) => like.user_id === user.id));
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/posts"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Knowledge</strong><small>{post.status}</small></div><Link href="/posts" className="back-link">All posts</Link></header><section className="workspace-content"><article className="workspace-panel"><p className="eyebrow"><span /> POST</p><h1>{post.title}</h1><p>{new Date(post.created_at).toLocaleDateString('ko-KR')}</p><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.body || 'No content yet.'}</div><div className="hero-actions"><form action={toggleLike}><input type="hidden" name="postId" value={post.id} /><button className="secondary">{liked ? 'Unlike' : 'Like'} · {likes?.length ?? 0}</button></form><form action={toggleBookmark}><input type="hidden" name="postId" value={post.id} /><button className="secondary">{bookmark ? 'Bookmarked' : 'Bookmark'}</button></form>{user?.id === post.author_id && <><Link className="secondary" href={`/posts/${post.id}/edit`}>Edit</Link><form action={deletePost}><input type="hidden" name="id" value={post.id} /><button className="secondary">Delete</button></form></>}</div></article><section className="workspace-panel"><div className="workspace-panel-title"><h2>Comments</h2><span>{comments.length}</span></div><div className="live-tasks">{comments.map((comment) => <div className="live-task" key={comment.id}>{comment.author_id === user.id ? <><form action={updateComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="postId" value={post.id} /><textarea name="body" defaultValue={comment.body} required maxLength={5000} rows={3} /><button className="secondary">Save</button></form><form action={deleteComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="postId" value={post.id} /><button className="secondary">Delete</button></form></> : <div><b>{comment.body}</b><small>{new Date(comment.created_at).toLocaleString('ko-KR')}</small></div>}</div>)}</div><form className="task-form" action={addComment}><input type="hidden" name="postId" value={post.id} /><label htmlFor="comment">Add a comment</label><textarea id="comment" name="body" required maxLength={5000} rows={4} /><button className="primary">Comment</button></form></section></section></main>;
}
