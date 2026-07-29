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
  const dueAt = String(formData.get('dueAt') ?? '');
  if (!title || !organizationId || !['low', 'medium', 'high'].includes(priority)) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('work_tasks').insert({ organization_id: organizationId, creator_id: user.id, assignee_id: user.id, title, priority, due_at: dueAt ? new Date(`${dueAt}T00:00:00`).toISOString() : null });
  if (error) throw new Error('작업을 만들지 못했습니다.');
  revalidatePath('/workspace');
}

export async function setTaskStatus(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'todo');
  if (!id || !['todo', 'in_progress', 'done'].includes(status)) return;
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
  await supabase.rpc('create_organization_notification', { target_user_id: profile.id, target_organization_id: organizationId, notification_kind: 'member_invited', notification_title: '워크스페이스 초대 대기', notification_body: '관리자 승인을 기다리고 있습니다.', notification_link: '/workspace' });
  revalidatePath('/workspace');
}

export async function approveMember(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  if (!organizationId || !userId) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('organization_members').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('organization_id', organizationId).eq('user_id', userId);
  if (error) throw new Error('승인하지 못했습니다.');
  await supabase.rpc('create_organization_notification', { target_user_id: userId, target_organization_id: organizationId, notification_kind: 'member_approved', notification_title: '워크스페이스 가입 승인', notification_body: '이제 업무공간을 사용할 수 있습니다.', notification_link: '/workspace' });
  revalidatePath('/workspace');
}

export async function uploadDocument(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const file = formData.get('file');
  if (!organizationId || !(file instanceof File) || file.size === 0) return;
  if (file.size > 10 * 1024 * 1024) throw new Error('파일은 10MB 이하만 올릴 수 있습니다.');
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (file.type && !allowedTypes.includes(file.type)) throw new Error('PDF, PNG, JPG, TXT, DOCX 파일만 올릴 수 있습니다.');
  const { supabase, user } = await requireUser();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'file';
  const storagePath = `${organizationId}/${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from('workhub-files').upload(storagePath, file, { contentType: file.type || 'application/octet-stream' });
  if (uploadError) throw new Error('파일 업로드에 실패했습니다.');
  const { error: documentError } = await supabase.from('documents').insert({
    organization_id: organizationId,
    uploader_id: user.id,
    title: file.name.slice(0, 240),
    storage_path: storagePath,
    content_type: file.type || null,
    size_bytes: file.size,
  });
  if (documentError) {
    await supabase.storage.from('workhub-files').remove([storagePath]);
    throw new Error('문서 정보를 저장하지 못했습니다.');
  }
  revalidatePath('/workspace');
}

export async function openDocument(formData: FormData) {
  const storagePath = String(formData.get('storagePath') ?? '');
  if (!storagePath) return;
  const { supabase } = await requireUser();
  const { data, error } = await supabase.storage.from('workhub-files').createSignedUrl(storagePath, 60);
  if (error || !data?.signedUrl) throw new Error('Unable to create a secure document link.');
  redirect(data.signedUrl);
}

export async function deleteDocument(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const storagePath = String(formData.get('storagePath') ?? '');
  if (!id || !storagePath) return;
  const { supabase } = await requireUser();
  const { error: storageError } = await supabase.storage.from('workhub-files').remove([storagePath]);
  if (storageError) throw new Error('Unable to delete the file.');
  const { error: documentError } = await supabase.from('documents').delete().eq('id', id);
  if (documentError) throw new Error('Unable to delete document metadata.');
  revalidatePath('/workspace');
}
