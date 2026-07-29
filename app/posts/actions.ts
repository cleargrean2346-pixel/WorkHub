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
  const categoryId = String(formData.get('categoryId') ?? '');
  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean);
  const coverImageUrl = String(formData.get('coverImageUrl') ?? '').trim();
  const scheduledAt = String(formData.get('scheduledAt') ?? '');
  if (!title) throw new Error('A post title is required.');
  if (coverImageUrl && !/^https?:\/\//.test(coverImageUrl)) throw new Error('Cover image must be a full https URL.');
  const { supabase, user, organizationId } = await currentOrganization();
  const status = publish ? 'published' : scheduledAt ? 'scheduled' : 'draft';
  const { data, error } = await supabase.from('posts').insert({ organization_id: organizationId, author_id: user.id, title, body, category_id: categoryId || null, cover_image_url: coverImageUrl || null, scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null, slug: slugify(title), status, published_at: publish ? new Date().toISOString() : null }).select('id').single();
  if (error || !data) throw new Error('Unable to create post.');
  if (tagIds.length) { const { error: tagError } = await supabase.from('post_tags').insert(tagIds.map((tagId) => ({ post_id: data.id, tag_id: tagId }))); if (tagError) throw new Error('Unable to save post tags.'); }
  revalidatePath('/posts');
  redirect(`/posts/${data.id}`);
}

export async function addComment(formData: FormData) {
  const postId = String(formData.get('postId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!postId || !body) return;
  const { supabase, user, organizationId } = await currentOrganization();
  const { error } = await supabase.from('comments').insert({ post_id: postId, author_id: user.id, body });
  if (error) throw new Error('Unable to add comment.');
  const { data: post } = await supabase.from('posts').select('author_id, title').eq('id', postId).maybeSingle();
  if (post && post.author_id !== user.id) await supabase.rpc('create_organization_notification', { target_user_id: post.author_id, target_organization_id: organizationId, notification_kind: 'comment_added', notification_title: 'New comment on your post', notification_body: post.title, notification_link: `/posts/${postId}` });
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

export async function updatePost(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const publish = formData.get('publish') === 'on';
  const categoryId = String(formData.get('categoryId') ?? '');
  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean);
  const coverImageUrl = String(formData.get('coverImageUrl') ?? '').trim();
  const scheduledAt = String(formData.get('scheduledAt') ?? '');
  if (!id || !title) throw new Error('A post title is required.');
  if (coverImageUrl && !/^https?:\/\//.test(coverImageUrl)) throw new Error('Cover image must be a full https URL.');
  const { supabase } = await currentOrganization();
  const status = publish ? 'published' : scheduledAt ? 'scheduled' : 'draft';
  const { error } = await supabase.from('posts').update({ title, body, category_id: categoryId || null, cover_image_url: coverImageUrl || null, scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null, status, published_at: publish ? new Date().toISOString() : null }).eq('id', id);
  if (error) throw new Error('Unable to update post.');
  const { error: deleteTagsError } = await supabase.from('post_tags').delete().eq('post_id', id); if (deleteTagsError) throw new Error('Unable to update post tags.');
  if (tagIds.length) { const { error: tagError } = await supabase.from('post_tags').insert(tagIds.map((tagId) => ({ post_id: id, tag_id: tagId }))); if (tagError) throw new Error('Unable to update post tags.'); }
  revalidatePath('/posts');
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { supabase } = await currentOrganization();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw new Error('Unable to delete post.');
  revalidatePath('/posts');
  redirect('/posts');
}

export async function createTaxonomy(formData: FormData) {
  const type = String(formData.get('type') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!['categories', 'tags'].includes(type) || !name) return;
  const { supabase, organizationId } = await currentOrganization();
  const slug = slugify(name);
  const { error } = await supabase.from(type).insert({ organization_id: organizationId, name, slug });
  if (error) throw new Error('Unable to create item.');
  revalidatePath('/manage/taxonomy');
}

export async function updateComment(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const postId = String(formData.get('postId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!id || !postId || !body) return;
  const { supabase } = await currentOrganization();
  const { error } = await supabase.from('comments').update({ body, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Unable to update comment.');
  revalidatePath(`/posts/${postId}`);
}

export async function deleteComment(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const postId = String(formData.get('postId') ?? '');
  if (!id || !postId) return;
  const { supabase } = await currentOrganization();
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw new Error('Unable to delete comment.');
  revalidatePath(`/posts/${postId}`);
}
