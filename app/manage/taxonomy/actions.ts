'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function adminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) throw new Error('Administrator access required.');
  return { supabase, organizationId: membership.organization_id };
}

export async function moveCategory(formData: FormData) {
  const categoryId = String(formData.get('categoryId') ?? '');
  const direction = String(formData.get('direction') ?? '');
  if (!categoryId || !['up', 'down'].includes(direction)) return;
  const { supabase, organizationId } = await adminContext();
  const { data: current, error: currentError } = await supabase.from('categories').select('id,sort_order').eq('id', categoryId).eq('organization_id', organizationId).maybeSingle();
  if (currentError || !current) throw new Error('Category not found.');
  const neighborQuery = supabase.from('categories').select('id,sort_order').eq('organization_id', organizationId);
  const { data: neighbor, error: neighborError } = direction === 'up'
    ? await neighborQuery.lt('sort_order', current.sort_order).order('sort_order', { ascending: false }).limit(1).maybeSingle()
    : await neighborQuery.gt('sort_order', current.sort_order).order('sort_order', { ascending: true }).limit(1).maybeSingle();
  if (neighborError || !neighbor) return;
  const { error: firstError } = await supabase.from('categories').update({ sort_order: neighbor.sort_order }).eq('id', current.id);
  if (firstError) throw new Error('Unable to change category order.');
  const { error: secondError } = await supabase.from('categories').update({ sort_order: current.sort_order }).eq('id', neighbor.id);
  if (secondError) throw new Error('Unable to change category order.');
  revalidatePath('/manage/taxonomy');
  revalidatePath('/');
  revalidatePath('/posts');
}

export async function deleteTaxonomy(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const type = String(formData.get('type') ?? '');
  if (!id || !['categories', 'tags'].includes(type)) return;
  const { supabase, organizationId } = await adminContext();
  const { error } = await supabase.rpc('admin_delete_taxonomy', { target_organization_id: organizationId, taxonomy_type: type, taxonomy_id: id });
  if (error) throw new Error('Unable to delete item.');
  revalidatePath('/manage/taxonomy');
  revalidatePath('/');
  revalidatePath('/posts');
}
