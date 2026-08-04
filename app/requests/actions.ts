'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function requestContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) throw new Error('Join a workspace first.');
  return { supabase, user, membership };
}

export async function createWorkRequest(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!title) throw new Error('A request title is required.');
  const { supabase, user, membership } = await requestContext();
  const { error } = await supabase.from('work_requests').insert({ organization_id: membership.organization_id, requester_id: user.id, title, body, status: 'submitted' });
  if (error) throw new Error('Unable to submit request.');
  const { data: admins } = await supabase.from('organization_members').select('user_id').eq('organization_id', membership.organization_id).eq('status', 'approved').in('role', ['organization_admin', 'system_admin']);
  await Promise.all((admins ?? []).filter((item) => item.user_id !== user.id).map((item) => supabase.rpc('create_organization_notification', { target_user_id: item.user_id, target_organization_id: membership.organization_id, notification_kind: 'request_submitted', notification_title: '새 업무 요청', notification_body: title, notification_link: '/requests' })));
  revalidatePath('/requests');
}

export async function decideWorkRequest(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const decisionNote = String(formData.get('decisionNote') ?? '').trim();
  if (!id || !['approved', 'rejected'].includes(status)) return;
  const { supabase, user, membership } = await requestContext();
  if (!['organization_admin', 'system_admin'].includes(membership.role)) throw new Error('Administrator access required.');
  const { data: request } = await supabase.from('work_requests').select('requester_id, organization_id, title').eq('id', id).maybeSingle();
  if (!request) throw new Error('Request not found.');
  const { error } = await supabase.from('work_requests').update({ status, approver_id: user.id, decision_note: decisionNote || null, decided_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Unable to decide request.');
  await supabase.rpc('create_organization_notification', { target_user_id: request.requester_id, target_organization_id: request.organization_id, notification_kind: 'request_decided', notification_title: `Request ${status}`, notification_body: request.title, notification_link: '/requests' });
  revalidatePath('/requests');
}

export async function startWorkRequestReview(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { supabase, membership } = await requestContext();
  if (!['organization_admin', 'system_admin'].includes(membership.role)) throw new Error('Administrator access required.');
  const { error } = await supabase.from('work_requests').update({ status: 'under_review' }).eq('id', id).eq('organization_id', membership.organization_id).eq('status', 'submitted');
  if (error) throw new Error('Unable to start review.');
  const { data: request } = await supabase.from('work_requests').select('requester_id,title').eq('id', id).maybeSingle();
  if (request) await supabase.rpc('create_organization_notification', { target_user_id: request.requester_id, target_organization_id: membership.organization_id, notification_kind: 'request_review', notification_title: '요청 검토 시작', notification_body: request.title, notification_link: '/requests' });
  revalidatePath('/requests');
}

export async function cancelWorkRequest(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { supabase, user, membership } = await requestContext();
  const { error } = await supabase.from('work_requests').update({ status: 'cancelled' }).eq('id', id).eq('organization_id', membership.organization_id).eq('requester_id', user.id).in('status', ['draft', 'submitted', 'under_review']);
  if (error) throw new Error('Unable to cancel request.');
  revalidatePath('/requests');
}
