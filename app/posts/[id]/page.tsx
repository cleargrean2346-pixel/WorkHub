import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { renderPostMarkdown } from '@/lib/markdown';
import { addComment, deleteComment, deletePost, toggleBookmark, toggleLike, updateComment } from '../actions';
import styles from './detail.module.css';

type Comment = { id: string; parent_id: string | null; body: string; author_id: string; created_at: string; updated_at: string | null };

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: post } = await supabase
    .from('posts')
    .select('id,title,body,status,created_at,author_id,view_count,cover_image_url,excerpt,featured,comments_enabled,last_edited_at,category_id,categories(name)')
    .eq('id', id)
    .maybeSingle();

  if (!post || (!user && post.status !== 'published')) notFound();
  await supabase.rpc('increment_post_views', { target_post_id: post.id });

  const [{ data: likes }, { data: bookmark }, { data: comments }] = await Promise.all([
    user ? supabase.from('likes').select('user_id').eq('post_id', post.id) : Promise.resolve({ data: [] }),
    user ? supabase.from('bookmarks').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    post.comments_enabled
      ? supabase.from('comments').select('id,parent_id,body,author_id,created_at,updated_at').eq('post_id', post.id).order('created_at')
      : Promise.resolve({ data: [] }),
  ]);
  const category = Array.isArray(post.categories) ? post.categories[0] : post.categories;
  const commentRows = (comments ?? []) as Comment[];
  const rootComments = commentRows.filter((item) => !item.parent_id);
  const orderedComments = rootComments.flatMap((item) => [item, ...commentRows.filter((reply) => reply.parent_id === item.id)]);
  const likeCount = likes?.length ?? 0;

  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <Link className="brand" href="/posts"><span className="brand-mark">W</span><span>workhub</span></Link>
        <div><strong>게시글</strong><small>{category?.name || '카테고리 없음'}</small></div>
        <Link href={post.category_id ? `/posts?category=${post.category_id}` : '/posts'} className="back-link">목록으로</Link>
      </header>

      <section className={`workspace-content ${styles.page}`}>
        <article className={`workspace-panel ${styles.article}`}>
          <div className={styles.metaTop}><span>{category?.name || '카테고리 없음'}</span>{post.featured && <b>중요</b>}</div>
          <h1>{post.title}</h1>
          {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
          <div className={styles.meta}>
            <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            {post.last_edited_at && <span>수정 {new Date(post.last_edited_at).toLocaleDateString('ko-KR')}</span>}
            <span>조회 {post.view_count}</span>
          </div>
          {post.cover_image_url && <img className={styles.cover} src={post.cover_image_url} alt="게시글 대표 이미지" />}
          <div className={styles.body} dangerouslySetInnerHTML={{ __html: renderPostMarkdown(post.body || '내용이 아직 없습니다.') }} />

          {user ? (
            <div className={styles.actions}>
              <form action={toggleLike}><input type="hidden" name="postId" value={post.id} /><button className="secondary">{likes?.some((item) => item.user_id === user.id) ? '좋아요 취소' : '좋아요'} {likeCount}</button></form>
              <form action={toggleBookmark}><input type="hidden" name="postId" value={post.id} /><button className="secondary">{bookmark ? '북마크됨' : '북마크'}</button></form>
              {user.id === post.author_id && <>
                <Link className="secondary" href={`/posts/${post.id}/edit`}>수정</Link>
                <Link className="secondary" href={`/posts/${post.id}/history`}>기록</Link>
                <form action={deletePost}><input type="hidden" name="id" value={post.id} /><button className={styles.delete}>삭제</button></form>
              </>}
            </div>
          ) : <Link className="primary" href="/login">로그인하고 반응 남기기</Link>}
        </article>

        {post.comments_enabled ? (
          <section className={`workspace-panel ${styles.comments}`}>
            <div className="workspace-panel-title"><h2>댓글</h2><span>{commentRows.length}</span></div>
            {user && <form className={styles.commentForm} action={addComment}><input type="hidden" name="postId" value={post.id} /><textarea name="body" required maxLength={5000} placeholder="댓글을 남겨보세요." /><button className="primary">댓글 작성</button></form>}
            {!user && <p className={styles.loginPrompt}><Link href="/login">로그인</Link> 후 댓글을 작성할 수 있습니다.</p>}
            {commentRows.length ? <div>{orderedComments.map((comment) => (
              <article className={`${styles.comment} ${comment.parent_id ? styles.reply : ''}`} key={comment.id}>
                <div>
                  <b>{comment.author_id === user?.id ? '나' : '구성원'}</b>
                  <small>{new Date(comment.created_at).toLocaleString('ko-KR')}{comment.updated_at ? ' · 수정됨' : ''}</small>
                  {comment.author_id === user?.id ? (
                    <form className={styles.editComment} action={updateComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="postId" value={post.id} /><textarea name="body" defaultValue={comment.body} required maxLength={5000} /><button className="secondary">저장</button></form>
                  ) : <p>{comment.body}</p>}
                  {user && <form className={styles.replyForm} action={addComment}><input type="hidden" name="postId" value={post.id} /><input type="hidden" name="parentId" value={comment.parent_id || comment.id} /><input name="body" required maxLength={5000} placeholder="답글 작성" /><button className="secondary">답글</button></form>}
                </div>
                {comment.author_id === user?.id && <form action={deleteComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="postId" value={post.id} /><button className={styles.delete}>삭제</button></form>}
              </article>
            ))}</div> : <div className="empty-state">아직 댓글이 없습니다.</div>}
          </section>
        ) : <section className="workspace-panel"><p>이 게시글은 댓글이 비활성화되어 있습니다.</p></section>}
      </section>
    </main>
  );
}
