'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '');

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function createOrganization(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('organizations').insert({
    name,
    slug: `${slugify(name) || 'workspace'}-${crypto.randomUUID().slice(0, 8)}`,
    created_by: user.id,
  });
  if (error) throw new Error('워크스페이스를 만들지 못했습니다.');
  revalidatePath('/workspace');
}

export async function createTask(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const organizationId = String(formData.get('organizationId') ?? '');
  const priority = String(formData.get('priority') ?? 'medium');
  if (!title || !organizationId || !['low', 'medium', 'high'].includes(priority)) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('work_tasks').insert({ organization_id: organizationId, creator_id: user.id, assignee_id: user.id, title, priority });
  if (error) throw new Error('작업을 만들지 못했습니다.');
  revalidatePath('/workspace');
}

export async function setTaskStatus(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'todo');
  if (!id || !['todo', 'done'].includes(status)) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from('work_tasks').update({ status }).eq('id', id);
  if (error) throw new Error('작업 상태를 변경하지 못했습니다.');
  revalidatePath('/workspace');
}

export async function inviteMember(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const organizationId = String(formData.get('organizationId') ?? '');
  if (!email || !organizationId) return;
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from('profiles').select('id').ilike('email', email).maybeSingle();
  if (!profile) throw new Error('이 이메일로 먼저 Google 또는 이메일 로그인을 완료해야 합니다.');
  const { error } = await supabase.from('organization_members').upsert({
    organization_id: organizationId,
    user_id: profile.id,
    role: 'member',
    status: 'pending',
    invited_by: user.id,
    invited_at: new Date().toISOString(),
    approved_by: null,
    approved_at: null,
  }, { onConflict: 'organization_id,user_id' });
  if (error) throw new Error('팀원 초대 요청을 저장하지 못했습니다.');
  revalidatePath('/workspace');
}

export async function approveMember(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  if (!organizationId || !userId) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('organization_members').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('organization_id', organizationId).eq('user_id', userId);
  if (error) throw new Error('승인하지 못했습니다.');
  revalidatePath('/workspace');
}
