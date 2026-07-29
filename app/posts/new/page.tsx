import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createPost } from '../actions';

export default async function NewPostPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  const { data: categories } = membership ? await supabase.from('categories').select('id, name').eq('organization_id', membership.organization_id).order('name') : { data: [] };
  const { data: tags } = membership ? await supabase.from('tags').select('id, name').eq('organization_id', membership.organization_id).order('name') : { data: [] };
  return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/posts"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> NEW POST</p><h1>Write a post</h1><form action={createPost}><label htmlFor="title">Title</label><input id="title" name="title" required maxLength={200} placeholder="Share an update or guide" /><label htmlFor="body">Content</label><textarea id="body" name="body" rows={12} placeholder="Write in plain text or Markdown..." /><label htmlFor="coverImageUrl">Cover image URL</label><input id="coverImageUrl" name="coverImageUrl" type="url" placeholder="https://... (optional)"/><label htmlFor="scheduledAt">Schedule publication</label><input id="scheduledAt" name="scheduledAt" type="datetime-local"/><label htmlFor="categoryId">Category</label><select id="categoryId" name="categoryId"><option value="">No category</option>{(categories ?? []).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><fieldset><legend>Tags</legend>{(tags ?? []).map((tag) => <label key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} /> #{tag.name}</label>)}</fieldset><label><input type="checkbox" name="publish" /> Publish immediately</label><button className="primary">Save post</button></form></section></main>;
}
