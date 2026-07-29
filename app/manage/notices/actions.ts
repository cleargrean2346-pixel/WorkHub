'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function adminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) throw new Error('Administrator access required.');
  return { supabase, user, organizationId: membership.organization_id };
}

export async function createNotice(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const publish = formData.get('publish') === 'on';
  const pinned = formData.get('pinned') === 'on';
  if (!title) throw new Error('A notice title is required.');
  const { supabase, user, organizationId } = await adminContext();
  const { data, error } = await supabase.from('notices').insert({ organization_id: organizationId, author_id: user.id, title, body, pinned, status: publish ? 'published' : 'draft', published_at: publish ? new Date().toISOString() : null }).select('id').single();
  if (error || !data) throw new Error('Unable to create notice.');
  await supabase.rpc('record_audit_log', { target_organization_id: organizationId, event_action: 'notice_created', event_target_type: 'notice', event_target_id: data.id });
  revalidatePath('/manage/notices'); revalidatePath('/notices');
}

export async function updateNoticeState(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const pinned = String(formData.get('pinned') ?? '') === 'true';
  if (!id || !['draft', 'published'].includes(status)) return;
  const { supabase, organizationId } = await adminContext();
  const { error } = await supabase.from('notices').update({ status, pinned, published_at: status === 'published' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Unable to update notice.');
  await supabase.rpc('record_audit_log', { target_organization_id: organizationId, event_action: 'notice_updated', event_target_type: 'notice', event_target_id: id });
  revalidatePath('/manage/notices'); revalidatePath('/notices');
}

export async function deleteNotice(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { supabase, organizationId } = await adminContext();
  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) throw new Error('Unable to delete notice.');
  await supabase.rpc('record_audit_log', { target_organization_id: organizationId, event_action: 'notice_deleted', event_target_type: 'notice', event_target_id: id });
  revalidatePath('/manage/notices'); revalidatePath('/notices');
}
