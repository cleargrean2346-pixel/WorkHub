import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateSiteSettings } from './actions';

export default async function SiteSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>Administrator access required</h1><Link className="primary" href="/workspace">Back to workspace</Link></section></main>;
  const [{ data: settings }, { data: categories }] = await Promise.all([
    supabase.from('site_settings').select('site_title,site_description,maintenance_enabled,home_category_ids').eq('id', true).maybeSingle(),
    supabase.from('categories').select('id,name').eq('organization_id', membership.organization_id).order('name'),
  ]);
  const selected = settings?.home_category_ids ?? [];
  return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span/> ADMIN</p><h1>Site settings</h1><p>Update site details and choose which categories appear below Calendar on the home sidebar.</p><form action={updateSiteSettings}><label>Site title<input name="siteTitle" defaultValue={settings?.site_title || 'WorkHub'} required maxLength={100}/></label><label>Site description<textarea name="siteDescription" defaultValue={settings?.site_description || ''} required maxLength={300} rows={4}/></label><fieldset><legend>Home categories</legend><p>Select the categories that should appear under Calendar on the home page.</p>{categories?.length ? categories.map((category) => <label key={category.id}><input type="checkbox" name="homeCategoryIds" value={category.id} defaultChecked={selected.includes(category.id)}/> {category.name}</label>) : <p>No categories have been created yet. Create them in Categories and tags first.</p>}</fieldset><label><input type="checkbox" name="maintenanceEnabled" defaultChecked={settings?.maintenance_enabled || false}/> Maintenance mode</label><button className="primary">Save site settings</button></form><Link className="back-link" href="/manage/dashboard">Back to admin</Link></section></main>;
}
