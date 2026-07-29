import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createProtectedLink, setProtectedLinkEnabled } from './actions';

type ProtectedLink = { id: string; post_id: string; original_url: string; protected_token: string; enabled: boolean; posts: { title: string } | { title: string }[] | null };

export default async function ProtectedLinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>Administrator access required</h1><Link className="primary" href="/workspace">Back to workspace</Link></section></main>;
  const { data: posts } = await supabase.from('posts').select('id, title').eq('organization_id', membership.organization_id).order('created_at', { ascending: false });
  const { data: rows } = await supabase.from('protected_urls').select('id, post_id, original_url, protected_token, enabled, posts(title)').order('created_at', { ascending: false });
  const links = (rows ?? []) as unknown as ProtectedLink[];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://work-hub-ashen.vercel.app';
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Protected links</strong><small>Secure redirect links</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> ADMIN</p><h1>Protect external URLs</h1><p>The destination URL is resolved only by the server after membership verification.</p></div><section className="workspace-panel"><form className="task-form" action={createProtectedLink}><label htmlFor="postId">Post</label><select id="postId" name="postId" required><option value="">Choose a post</option>{(posts ?? []).map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}</select><label htmlFor="originalUrl">Destination HTTPS URL</label><input id="originalUrl" name="originalUrl" type="url" placeholder="https://example.com/private-resource" required /><button className="primary">Create protected link</button></form></section><section className="workspace-panel"><div className="workspace-panel-title"><h2>Links</h2><span>{links.length}</span></div><div className="live-tasks">{links.map((link) => { const post = Array.isArray(link.posts) ? link.posts[0] : link.posts; return <div className="live-task" key={link.id}><div><b>{post?.title || 'Post'}</b><small>{appUrl}/go/{link.protected_token} · {link.enabled ? 'enabled' : 'disabled'}</small></div><form action={setProtectedLinkEnabled}><input type="hidden" name="id" value={link.id} /><input type="hidden" name="enabled" value={String(!link.enabled)} /><button className="secondary">{link.enabled ? 'Disable' : 'Enable'}</button></form></div>; })}</div></section></section></main>;
}
