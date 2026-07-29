import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Banner = { id: string; title: string; message: string; link_url: string | null; placement: string };

export default async function BannersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="onboarding"><section className="onboarding-card"><h1>Sign in to view announcements</h1><Link className="primary" href="/login">Log in</Link></section></main>;
  const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!member) return <main className="onboarding"><section className="onboarding-card"><h1>Join a workspace first</h1><Link className="primary" href="/workspace">Workspace</Link></section></main>;
  const { data: rows } = await supabase.from('banners').select('id,title,message,link_url,placement').eq('organization_id', member.organization_id).eq('status', 'published').order('created_at', { ascending: false });
  const banners = (rows ?? []) as Banner[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Announcements</strong><small>Workspace updates</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ANNOUNCEMENTS</p><h1>Workspace updates</h1><p>Important messages published for your organization.</p></div><section className="workspace-panel"><div className="workspace-panel-title"><h2>Announcements</h2><span>{banners.length}</span></div>{banners.length ? <div className="live-tasks">{banners.map((banner) => <article className="live-task" key={banner.id}><div><b>{banner.title}</b><small>{banner.placement} · {banner.message}</small></div>{banner.link_url && <a className="secondary" href={banner.link_url} target="_blank" rel="noreferrer">Open</a>}</article>)}</div> : <div className="empty-state">No announcements have been published yet.</div>}</section></section></main>;
}
