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
  return { supabase, membership };
}

export async function createDepartment(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const { supabase, membership } = await adminContext();
  const { error } = await supabase.from('departments').insert({ organization_id: membership.organization_id, name });
  if (error) throw new Error('Unable to create department.');
  revalidatePath('/manage/structure');
}

export async function createTeam(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const departmentId = String(formData.get('departmentId') ?? '');
  if (!name) return;
  const { supabase, membership } = await adminContext();
  const { error } = await supabase.from('teams').insert({ organization_id: membership.organization_id, department_id: departmentId || null, name });
  if (error) throw new Error('Unable to create team.');
  revalidatePath('/manage/structure');
}

export async function assignMemberTeam(formData: FormData) {
  const userId = String(formData.get('userId') ?? '');
  const teamId = String(formData.get('teamId') ?? '');
  if (!userId) return;
  const { supabase, membership } = await adminContext();
  const { error } = await supabase.from('organization_members').update({ team_id: teamId || null }).eq('organization_id', membership.organization_id).eq('user_id', userId);
  if (error) throw new Error('Unable to assign team.');
  revalidatePath('/manage/structure');
}
