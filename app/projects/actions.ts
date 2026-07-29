'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function createProject(formData: FormData) {
  const organizationId = String(formData.get('organizationId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priority = String(formData.get('priority') ?? 'medium');
  const startAt = String(formData.get('startAt') ?? '');
  const dueAt = String(formData.get('dueAt') ?? '');
  if (!organizationId || !name || !['low', 'medium', 'high'].includes(priority)) return;
  const { supabase, user } = await context();
  const { error } = await supabase.from('projects').insert({ organization_id: organizationId, creator_id: user.id, name, description, priority, start_at: startAt || null, due_at: dueAt || null });
  if (error) throw new Error('Unable to create the project.');
  revalidatePath('/projects');
}

export async function updateProjectStatus(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !['planned', 'active', 'on_hold', 'completed', 'archived'].includes(status)) return;
  const { supabase } = await context();
  const { error } = await supabase.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Unable to update the project.');
  revalidatePath('/projects');
}
