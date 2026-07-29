import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createTaxonomy } from '@/app/posts/actions';
import { moveCategory } from './actions';
import styles from './taxonomy.module.css';

export default async function TaxonomyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>Administrator access required</h1><Link className="primary" href="/workspace">Back to workspace</Link></section></main>;
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from('categories').select('id,name,sort_order').eq('organization_id', membership.organization_id).order('sort_order').order('created_at'),
    supabase.from('tags').select('id,name').eq('organization_id', membership.organization_id).order('name'),
  ]);
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>카테고리·태그 관리</strong><small>{(categories?.length ?? 0) + (tags?.length ?? 0)}개 항목</small></div><Link className="back-link" href="/manage/dashboard">관리자 페이지</Link></header><section className={`workspace-content ${styles.page}`}><div className="workspace-intro"><p className="eyebrow"><span/> ADMIN</p><h1>게시글 분류 관리</h1><p>카테고리 순서는 홈과 게시글 작성 화면에 반영됩니다. 순서를 바꿔도 게시글의 카테고리 연결은 유지됩니다.</p></div><div className={styles.grid}><section className="workspace-panel"><div className={styles.heading}><div><h2>카테고리</h2><p>드래그 대신 위·아래 버튼으로 표시 순서를 변경하세요.</p></div><span>{categories?.length ?? 0}</span></div><form className={styles.createForm} action={createTaxonomy}><input type="hidden" name="type" value="categories"/><input name="name" placeholder="새 카테고리 이름" maxLength={80} required/><button className="primary">추가</button></form>{categories?.length ? <div className={styles.items}>{categories.map((category, index) => <div className={styles.item} key={category.id}><span className={styles.order}>{index + 1}</span><b>{category.name}</b><div className={styles.controls}><form action={moveCategory}><input type="hidden" name="categoryId" value={category.id}/><input type="hidden" name="direction" value="up"/><button className="secondary" disabled={index === 0}>위로</button></form><form action={moveCategory}><input type="hidden" name="categoryId" value={category.id}/><input type="hidden" name="direction" value="down"/><button className="secondary" disabled={index === categories.length - 1}>아래로</button></form></div></div>)}</div> : <div className="empty-state">카테고리가 없습니다. 첫 카테고리를 추가하세요.</div>}</section><section className="workspace-panel"><div className={styles.heading}><div><h2>태그</h2><p>게시글을 더 세밀하게 분류합니다.</p></div><span>{tags?.length ?? 0}</span></div><form className={styles.createForm} action={createTaxonomy}><input type="hidden" name="type" value="tags"/><input name="name" placeholder="새 태그 이름" maxLength={80} required/><button className="primary">추가</button></form>{tags?.length ? <div className={styles.items}>{tags.map((tag) => <div className={styles.item} key={tag.id}><span className={styles.tagMark}>#</span><b>{tag.name}</b></div>)}</div> : <div className="empty-state">태그가 없습니다.</div>}</section></div></section></main>;
}
