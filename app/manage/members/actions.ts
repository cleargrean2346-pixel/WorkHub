'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const allowedRoles = ['member', 'team_leader', 'manager', 'organization_admin'];

export async function changeMemberRole(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!organizationId || !userId || !allowedRoles.includes(role)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: current } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle();
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) throw new Error('Administrator access required.');
  const { data: target } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  if (target?.role === 'system_admin') throw new Error('The system administrator role cannot be changed.');
  const { error } = await supabase.from('organization_members').update({ role }).eq('organization_id', organizationId).eq('user_id', userId);
  if (error) throw new Error('Unable to change member role.');
  revalidatePath('/manage/members');
}

export async function approveMember(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  if (!organizationId || !userId) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: current } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle();
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) throw new Error('Administrator access required.');
  const { error } = await supabase.from('organization_members').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('organization_id', organizationId).eq('user_id', userId);
  if (error) throw new Error('Unable to approve member.');
  revalidatePath('/manage/members');
  revalidatePath('/manage/members/pending');
  revalidatePath('/workspace');
}

export async function rejectMember(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  if (!organizationId || !userId) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: current } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle();
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) throw new Error('Administrator access required.');
  const { error } = await supabase.from('organization_members').update({ status: 'suspended' }).eq('organization_id', organizationId).eq('user_id', userId).eq('status', 'pending');
  if (error) throw new Error('Unable to reject member.');
  revalidatePath('/manage/members');
  revalidatePath('/manage/members/pending');
}
