'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const allowedRoles = ['member', 'team_leader', 'manager', 'organization_admin', 'system_admin'];

async function administratorContext(organizationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: current } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).eq('status', 'approved').maybeSingle();
  if (!current || !['organization_admin', 'system_admin'].includes(current.role)) throw new Error('관리자 권한이 필요합니다.');
  return { supabase, user, current };
}

function refreshMembers() {
  revalidatePath('/manage/members');
  revalidatePath('/manage/members/pending');
  revalidatePath('/manage/dashboard');
  revalidatePath('/workspace');
}

export async function changeMemberRole(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!organizationId || !userId || !allowedRoles.includes(role)) return;
  const { supabase } = await administratorContext(organizationId);
  const { error } = await supabase.rpc('admin_set_member_role', { target_organization_id: organizationId, target_user_id: userId, next_role: role });
  if (error) throw new Error(error.message || '권한을 변경하지 못했습니다.');
  refreshMembers();
}

export async function removeMember(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  if (!organizationId || !userId) return;
  const { supabase } = await administratorContext(organizationId);
  const { error } = await supabase.rpc('admin_suspend_member', { target_organization_id: organizationId, target_user_id: userId });
  if (error) throw new Error(error.message || '구성원을 탈퇴 처리하지 못했습니다.');
  refreshMembers();
}

export async function approveMember(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  if (!organizationId || !userId) return;
  const { supabase, user } = await administratorContext(organizationId);
  const { error } = await supabase.from('organization_members').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('organization_id', organizationId).eq('user_id', userId).eq('status', 'pending');
  if (error) throw new Error('구성원을 승인하지 못했습니다.');
  refreshMembers();
}

export async function rejectMember(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  if (!organizationId || !userId) return;
  const { supabase } = await administratorContext(organizationId);
  const { error } = await supabase.from('organization_members').update({ status: 'suspended' }).eq('organization_id', organizationId).eq('user_id', userId).eq('status', 'pending');
  if (error) throw new Error('가입 요청을 반려하지 못했습니다.');
  refreshMembers();
}
