import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createTaxonomy } from '@/app/posts/actions';

export default async function TaxonomyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) notFound();
  const { data: categoryRows } = await supabase.from('categories').select('id, name').eq('organization_id', membership.organization_id).order('name');
  const { data: tagRows } = await supabase.from('tags').select('id, name').eq('organization_id', membership.organization_id).order('name');
  return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/workspace"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> ADMIN</p><h1>Categories and tags</h1><form action={createTaxonomy}><input type="hidden" name="type" value="categories" /><label htmlFor="category">New category</label><input id="category" name="name" maxLength={80} required /><button className="primary">Add category</button></form><div className="live-tasks">{(categoryRows ?? []).map((item) => <div className="live-task" key={item.id}><b>{item.name}</b></div>)}</div><form action={createTaxonomy}><input type="hidden" name="type" value="tags" /><label htmlFor="tag">New tag</label><input id="tag" name="name" maxLength={80} required /><button className="primary">Add tag</button></form><div className="live-tasks">{(tagRows ?? []).map((item) => <div className="live-task" key={item.id}><b>#{item.name}</b></div>)}</div></section></main>;
}
