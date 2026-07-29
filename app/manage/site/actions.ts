'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function updateSiteSettings(formData: FormData) {
  const siteTitle = String(formData.get('siteTitle') ?? '').trim();
  const siteDescription = String(formData.get('siteDescription') ?? '').trim();
  const maintenanceEnabled = formData.get('maintenanceEnabled') === 'on';
  const homeCategoryIds = formData.getAll('homeCategoryIds').map(String).filter(Boolean);
  if (!siteTitle || !siteDescription) throw new Error('Title and description are required.');
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) throw new Error('Administrator access required.');
  const { error } = await supabase.from('site_settings').update({ site_title: siteTitle, site_description: siteDescription, maintenance_enabled: maintenanceEnabled, home_category_ids: homeCategoryIds, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', true);
  if (error) throw new Error('Unable to update site settings.');
  await supabase.rpc('record_audit_log', { target_organization_id: membership.organization_id, event_action: 'site_settings_updated', event_target_type: 'site_settings', event_target_id: 'default' });
  revalidatePath('/manage/site');
  revalidatePath('/');
}
