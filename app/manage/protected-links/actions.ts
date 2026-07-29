'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function adminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) throw new Error('Administrator access required.');
  return { supabase, user, membership };
}

export async function createProtectedLink(formData: FormData) {
  const postId = String(formData.get('postId') ?? '');
  const originalUrl = String(formData.get('originalUrl') ?? '').trim();
  if (!postId || !/^https:\/\//.test(originalUrl)) throw new Error('Enter a valid HTTPS URL.');
  const { supabase, user } = await adminContext();
  const token = randomBytes(24).toString('base64url');
  const { error } = await supabase.from('protected_urls').insert({ post_id: postId, original_url: originalUrl, protected_token: token, created_by: user.id });
  if (error) throw new Error('Unable to create protected link.');
  revalidatePath('/manage/protected-links');
}

export async function setProtectedLinkEnabled(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const enabled = String(formData.get('enabled') ?? '') === 'true';
  if (!id) return;
  const { supabase } = await adminContext();
  const { error } = await supabase.from('protected_urls').update({ enabled, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Unable to update protected link.');
  revalidatePath('/manage/protected-links');
}
