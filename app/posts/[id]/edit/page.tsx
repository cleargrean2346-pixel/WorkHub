import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updatePost } from '../../actions';
import { PostEditor } from '../../new/post-editor';
import styles from '../../new/editor.module.css';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: post } = await supabase.from('posts').select('id,title,body,status,author_id,organization_id,category_id,cover_image_url,scheduled_at,excerpt,featured,comments_enabled').eq('id', id).maybeSingle();
  if (!post || post.author_id !== user.id) notFound();
  const [{ data: categories }, { data: tags }, { data: postTags }] = await Promise.all([
    supabase.from('categories').select('id,name').eq('organization_id', post.organization_id).order('sort_order').order('name'),
    supabase.from('tags').select('id,name').eq('organization_id', post.organization_id).order('name'),
    supabase.from('post_tags').select('tag_id').eq('post_id', post.id),
  ]);
  const selectedTags = new Set((postTags ?? []).map((row) => row.tag_id));
  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>게시글 수정</strong><small>변경 내용은 기록에 남습니다.</small></div><Link className="back-link" href={`/posts/${post.id}`}>글로 돌아가기</Link></header>
    <section className={`workspace-content ${styles.editor}`}>
      <div className="workspace-intro"><p className="eyebrow"><span /> EDIT POST</p><h1>게시글 수정</h1><p>본문 서식과 이미지는 Markdown 문법으로 유지됩니다.</p></div>
      <form action={updatePost} className={styles.form}>
        <input type="hidden" name="id" value={post.id} />
        <section className={`workspace-panel ${styles.mainPanel}`}>
          <label htmlFor="title">제목 <b>*</b></label><input id="title" name="title" defaultValue={post.title} required maxLength={200} />
          <label htmlFor="excerpt">요약</label><textarea id="excerpt" name="excerpt" defaultValue={post.excerpt || ''} rows={3} maxLength={500} />
          <label htmlFor="body">본문</label><PostEditor organizationId={post.organization_id} initialValue={post.body || ''} />
        </section>
        <aside className={styles.sidePanel}>
          <section className="workspace-panel">
            <label htmlFor="categoryId">카테고리</label><select id="categoryId" name="categoryId" defaultValue={post.category_id || ''}><option value="">카테고리 없음</option>{(categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
            <fieldset className={styles.tags}><legend>태그</legend>{(tags ?? []).map((tag) => <label key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={selectedTags.has(tag.id)} /> #{tag.name}</label>)}</fieldset>
          </section>
          <section className="workspace-panel">
            <label htmlFor="coverImageUrl">대표 이미지 URL</label><input id="coverImageUrl" name="coverImageUrl" type="url" defaultValue={post.cover_image_url || ''} />
            <label htmlFor="scheduledAt">예약 게시</label><input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : ''} />
            <div className={styles.options}><label><input type="checkbox" name="featured" defaultChecked={post.featured} /> 중요 게시글</label><label><input type="checkbox" name="commentsEnabled" defaultChecked={post.comments_enabled} /> 댓글 허용</label><label><input type="checkbox" name="publish" defaultChecked={post.status === 'published'} /> 게시</label></div>
          </section>
          <div className={styles.actions}><button className="primary">변경 저장</button><Link className="secondary" href={`/posts/${post.id}`}>취소</Link></div>
        </aside>
      </form>
    </section>
  </main>;
}
