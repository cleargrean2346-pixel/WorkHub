'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function saveProfile(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim();
  if (!fullName || fullName.length > 80) throw new Error('Enter a name up to 80 characters.');
  if (avatarUrl && !/^https:\/\//.test(avatarUrl)) throw new Error('Avatar URL must start with https://');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { error } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl || null, updated_at: new Date().toISOString() }).eq('id', user.id);
  if (error) throw new Error('Unable to save profile.');
  revalidatePath('/settings/profile');
  revalidatePath('/workspace');
  revalidatePath('/');
}
