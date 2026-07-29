'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
async function context() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login'); return { supabase, user }; }
export async function updateTaskDetails(formData: FormData) {
  const id = String(formData.get('id') ?? ''); const title = String(formData.get('title') ?? '').trim(); const description = String(formData.get('description') ?? '').trim(); const projectId = String(formData.get('projectId') ?? ''); const priority = String(formData.get('priority') ?? 'medium'); const status = String(formData.get('status') ?? 'todo'); const startAt = String(formData.get('startAt') ?? ''); const dueAt = String(formData.get('dueAt') ?? ''); const labels = String(formData.get('labels') ?? '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 12); const recurrence = String(formData.get('recurrence') ?? '');
  if (!id || !title || !['low','medium','high'].includes(priority) || !['todo','in_progress','done'].includes(status) || (recurrence && !['daily','weekly','monthly'].includes(recurrence))) return;
  const { supabase } = await context(); const { error } = await supabase.from('work_tasks').update({ title, description, project_id: projectId || null, priority, status, start_at: startAt || null, due_at: dueAt || null, labels, recurrence: recurrence || null }).eq('id', id); if (error) throw new Error('Unable to save the task.'); revalidatePath('/tasks'); revalidatePath(`/tasks/${id}`);
}
export async function archiveTask(formData: FormData) { const id = String(formData.get('id') ?? ''); if (!id) return; const { supabase } = await context(); const { error } = await supabase.from('work_tasks').update({ archived_at: new Date().toISOString() }).eq('id', id); if (error) throw new Error('Unable to archive the task.'); revalidatePath('/tasks'); redirect('/tasks'); }
export async function addTaskComment(formData: FormData) { const taskId = String(formData.get('taskId') ?? ''); const body = String(formData.get('body') ?? '').trim(); if (!taskId || !body) return; const { supabase, user } = await context(); const { error } = await supabase.from('task_comments').insert({ task_id: taskId, author_id: user.id, body }); if (error) throw new Error('Unable to add the comment.'); revalidatePath(`/tasks/${taskId}`); }
