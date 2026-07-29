import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createPost } from '../actions';
import styles from './editor.module.css';

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) return <main className="onboarding"><section className="onboarding-card"><p className="eyebrow"><span /> NEW POST</p><h1>워크스페이스에 먼저 참여하세요</h1><p>승인된 워크스페이스 멤버만 팀 게시글을 작성할 수 있습니다.</p><Link className="primary" href="/workspace">내 공간 열기</Link><Link className="back-link" href="/posts">게시글 목록</Link></section></main>;

  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('organization_id', membership.organization_id).order('name'),
    supabase.from('tags').select('id, name').eq('organization_id', membership.organization_id).order('name'),
  ]);

  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>게시글 작성</strong><small>팀에 공유할 지식과 소식을 작성하세요</small></div><Link className="back-link" href="/posts">목록으로</Link></header>
    <section className={`workspace-content ${styles.editor}`}>
      <div className="workspace-intro"><p className="eyebrow"><span /> KNOWLEDGE</p><h1>새 게시글 작성</h1><p>임시 저장하거나, 준비가 되면 바로 게시할 수 있습니다.</p></div>
      <form action={createPost} className={styles.form}>
        <section className={`workspace-panel ${styles.mainPanel}`}>
          <div className={styles.sectionTitle}><div><h2>내용</h2><p>독자가 가장 먼저 보게 될 정보입니다.</p></div><span>필수 항목</span></div>
          <label htmlFor="title">제목 <b>*</b></label><input id="title" name="title" required maxLength={200} placeholder="예: 8월 제품 업데이트 안내" autoFocus />
          <label htmlFor="excerpt">요약</label><textarea id="excerpt" name="excerpt" rows={3} maxLength={500} placeholder="게시글을 한두 문장으로 소개해 주세요. (선택)" />
          <label htmlFor="body">본문</label><textarea id="body" name="body" rows={16} placeholder="내용을 작성하세요. 일반 텍스트와 Markdown을 사용할 수 있습니다." />
        </section>
        <aside className={styles.sidePanel}>
          <section className="workspace-panel">
            <div className={styles.sectionTitle}><div><h2>분류</h2><p>검색과 탐색에 사용됩니다.</p></div></div>
            <label htmlFor="categoryId">카테고리</label><select id="categoryId" name="categoryId"><option value="">카테고리 없음</option>{(categories ?? []).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>
            <fieldset className={styles.tags}><legend>태그</legend>{tags?.length ? <div>{tags.map((tag) => <label key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} /> #{tag.name}</label>)}</div> : <p>등록된 태그가 없습니다.</p>}</fieldset>
          </section>
          <section className="workspace-panel">
            <div className={styles.sectionTitle}><div><h2>게시 설정</h2><p>공개 방식과 옵션을 선택하세요.</p></div></div>
            <label htmlFor="coverImageUrl">대표 이미지 URL</label><input id="coverImageUrl" name="coverImageUrl" type="url" placeholder="https://… (선택)" />
            <label htmlFor="scheduledAt">예약 게시</label><input id="scheduledAt" name="scheduledAt" type="datetime-local" />
            <div className={styles.options}><label><input type="checkbox" name="featured" /> 중요 게시글로 표시</label><label><input type="checkbox" name="commentsEnabled" defaultChecked /> 댓글 허용</label><label><input type="checkbox" name="publish" /> 지금 바로 게시</label></div>
          </section>
          <div className={styles.actions}><button className="primary">저장하기</button><Link className="secondary" href="/posts">취소</Link></div>
        </aside>
      </form>
    </section>
  </main>;
}
