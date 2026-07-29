import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updatePost } from '../../actions';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: post } = await supabase.from('posts').select('id, title, body, status, author_id').eq('id', id).maybeSingle();
  if (!post || !user || post.author_id !== user.id) notFound();
  return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href={`/posts/${post.id}`}><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> EDIT POST</p><h1>Edit post</h1><form action={updatePost}><input type="hidden" name="id" value={post.id} /><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={post.title} required maxLength={200} /><label htmlFor="body">Content</label><textarea id="body" name="body" defaultValue={post.body} rows={12} /><label><input type="checkbox" name="publish" defaultChecked={post.status === 'published'} /> Publish</label><button className="primary">Save changes</button></form></section></main>;
}
