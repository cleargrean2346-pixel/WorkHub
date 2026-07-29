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
  revalidatePath('/requests');
}

export async function decideWorkRequest(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const decisionNote = String(formData.get('decisionNote') ?? '').trim();
  if (!id || !['approved', 'rejected'].includes(status)) return;
  const { supabase, user, membership } = await requestContext();
  if (!['organization_admin', 'system_admin'].includes(membership.role)) throw new Error('Administrator access required.');
  const { error } = await supabase.from('work_requests').update({ status, approver_id: user.id, decision_note: decisionNote || null, decided_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Unable to decide request.');
  revalidatePath('/requests');
}
