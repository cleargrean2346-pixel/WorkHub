'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function slugify(value: string) {
  const clean = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${clean || 'post'}-${crypto.randomUUID().slice(0, 8)}`;
}

async function currentOrganization() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) throw new Error('Create or join a workspace first.');
  return { supabase, user, organizationId: membership.organization_id };
}

export async function createPost(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const publish = formData.get('publish') === 'on';
  if (!title) throw new Error('A post title is required.');
  const { supabase, user, organizationId } = await currentOrganization();
  const { data, error } = await supabase.from('posts').insert({ organization_id: organizationId, author_id: user.id, title, body, slug: slugify(title), status: publish ? 'published' : 'draft', published_at: publish ? new Date().toISOString() : null }).select('id').single();
  if (error || !data) throw new Error('Unable to create post.');
  revalidatePath('/posts');
  redirect(`/posts/${data.id}`);
}

export async function addComment(formData: FormData) {
  const postId = String(formData.get('postId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!postId || !body) return;
  const { supabase, user } = await currentOrganization();
  const { error } = await supabase.from('comments').insert({ post_id: postId, author_id: user.id, body });
  if (error) throw new Error('Unable to add comment.');
  revalidatePath(`/posts/${postId}`);
}

export async function toggleLike(formData: FormData) {
  const postId = String(formData.get('postId') ?? '');
  if (!postId) return;
  const { supabase, user } = await currentOrganization();
  const { data: existing } = await supabase.from('likes').select('post_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
  const { error } = existing ? await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id) : await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
  if (error) throw new Error('Unable to update like.');
  revalidatePath(`/posts/${postId}`);
}

export async function toggleBookmark(formData: FormData) {
  const postId = String(formData.get('postId') ?? '');
  if (!postId) return;
  const { supabase, user } = await currentOrganization();
  const { data: existing } = await supabase.from('bookmarks').select('post_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
  const { error } = existing ? await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', user.id) : await supabase.from('bookmarks').insert({ post_id: postId, user_id: user.id });
  if (error) throw new Error('Unable to update bookmark.');
  revalidatePath(`/posts/${postId}`);
}
