import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addComment, deleteComment, deletePost, toggleBookmark, toggleLike, updateComment } from '../actions';

type Comment = { id: string; body: string; author_id: string; created_at: string; updated_at: string | null };

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: post } = await supabase.from('posts').select('id,title,body,status,created_at,author_id,view_count,cover_image_url,excerpt,featured,comments_enabled,last_edited_at').eq('id', id).maybeSingle();
  if (!post || (!user && post.status !== 'published')) notFound();

  await supabase.rpc('increment_post_views', { target_post_id: post.id });
  const [{ data: likes }, { data: bookmark }, { data: comments }] = await Promise.all([
    user ? supabase.from('likes').select('user_id').eq('post_id', post.id) : Promise.resolve({ data: [] }),
    user ? supabase.from('bookmarks').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    post.comments_enabled ? supabase.from('comments').select('id,body,author_id,created_at,updated_at').eq('post_id', post.id).order('created_at') : Promise.resolve({ data: [] }),
  ]);
  const commentRows = (comments ?? []) as Comment[];
  const likeCount = likes?.length ?? 0;

  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/posts"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Knowledge</strong><small>{post.status}</small></div><Link href="/posts" className="back-link">All posts</Link></header>
    <section className="workspace-content">
      <article className="workspace-panel">
        <p className="eyebrow"><span /> {post.featured ? 'FEATURED POST' : 'POST'}</p>
        <h1>{post.title}</h1>
        {post.excerpt && <p>{post.excerpt}</p>}
        <p>{new Date(post.created_at).toLocaleDateString('ko-KR')}{post.last_edited_at ? ` · edited ${new Date(post.last_edited_at).toLocaleDateString('ko-KR')}` : ''} · {post.view_count} views</p>
        {post.cover_image_url && <img src={post.cover_image_url} alt="" style={{ maxWidth: '100%', height: 'auto' }} />}
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.body || 'No content yet.'}</div>
        {user ? <div className="hero-actions">
          <form action={toggleLike}><input type="hidden" name="postId" value={post.id} /><button className="secondary">{likes?.some((item) => item.user_id === user.id) ? 'Unlike' : 'Like'} · {likeCount}</button></form>
          <form action={toggleBookmark}><input type="hidden" name="postId" value={post.id} /><button className="secondary">{bookmark ? 'Bookmarked' : 'Bookmark'}</button></form>
          {user.id === post.author_id && <><Link className="secondary" href={`/posts/${post.id}/edit`}>Edit</Link><Link className="secondary" href={`/posts/${post.id}/history`}>History</Link><form action={deletePost}><input type="hidden" name="id" value={post.id} /><button className="secondary">Delete</button></form></>}
        </div> : <Link className="primary" href="/login">Log in to interact</Link>}
      </article>
      {post.comments_enabled ? <section className="workspace-panel">
        <div className="workspace-panel-title"><h2>Comments</h2><span>{commentRows.length}</span></div>
        {user && <form className="task-form" action={addComment}><input type="hidden" name="postId" value={post.id} /><textarea name="body" required maxLength={5000} placeholder="Add a comment" /><button className="primary">Comment</button></form>}
        {!user && <p><Link href="/login">Log in</Link> to join the conversation.</p>}
        {commentRows.length ? <div className="live-tasks">{commentRows.map((comment) => <article className="live-task" key={comment.id}><div><b>{comment.author_id === user?.id ? 'You' : 'Member'}</b><small>{new Date(comment.created_at).toLocaleString('ko-KR')}{comment.updated_at ? ' · edited' : ''}</small>{comment.author_id === user?.id ? <form className="task-form" action={updateComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="postId" value={post.id} /><textarea name="body" defaultValue={comment.body} required maxLength={5000} /><button className="secondary">Save</button></form> : <p>{comment.body}</p>}</div>{comment.author_id === user?.id && <form action={deleteComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="postId" value={post.id} /><button className="secondary">Delete</button></form>}</article>)}</div> : <div className="empty-state">No comments yet.</div>}
      </section> : <section className="workspace-panel"><p>Comments are disabled for this post.</p></section>}
    </section>
  </main>;
}
