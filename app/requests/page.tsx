import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createWorkRequest, decideWorkRequest } from './actions';

type WorkRequest = { id: string; title: string; body: string; status: string; decision_note: string | null; created_at: string };

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) return <main className="onboarding"><section className="onboarding-card"><h1>Join a workspace first</h1><Link className="primary" href="/workspace">Open workspace</Link></section></main>;
  const { data: rows } = await supabase.from('work_requests').select('id,title,body,status,decision_note,created_at').eq('organization_id', membership.organization_id).order('created_at', { ascending: false });
  const requests = (rows ?? []) as WorkRequest[];
  const isAdmin = ['organization_admin', 'system_admin'].includes(membership.role);
  const pending = requests.filter((item) => ['submitted', 'under_review'].includes(item.status)).length;
  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Requests</strong><small>{pending} awaiting decision</small></div><Link className="back-link" href="/workspace">Workspace</Link></header>
    <section className="workspace-content">
      <div className="workspace-intro"><p className="eyebrow"><span /> REQUESTS</p><h1>Request and approve work</h1><p>Submit a request and follow its decision here.</p></div>
      <div className="workspace-grid">
        <section className="workspace-panel"><h2>New request</h2><form className="task-form" action={createWorkRequest}><label htmlFor="title">Request title</label><input id="title" name="title" required maxLength={200} placeholder="Example: Purchase approval"/><label htmlFor="body">Details</label><textarea id="body" name="body" rows={6} placeholder="Explain the request and context"/><button className="primary">Submit request</button></form></section>
        <section className="workspace-panel"><div className="workspace-panel-title"><h2>Request list</h2><span>{requests.length}</span></div>{requests.length ? <div className="live-tasks">{requests.map((request) => <article className="live-task" key={request.id}><div><b>{request.title}</b><small>{request.status} · {new Date(request.created_at).toLocaleDateString('ko-KR')}</small><p>{request.body || 'No details provided.'}</p>{request.decision_note && <small>Decision note: {request.decision_note}</small>}</div>{isAdmin && ['submitted', 'under_review'].includes(request.status) && <form className="task-form" action={decideWorkRequest}><input type="hidden" name="id" value={request.id}/><input name="decisionNote" placeholder="Optional decision note"/><div className="hero-actions"><button className="primary" name="status" value="approved">Approve</button><button className="secondary" name="status" value="rejected">Reject</button></div></form>}</article>)}</div> : <div className="empty-state">No requests yet. Submit the first request above.</div>}</section>
      </div>
    </section>
  </main>;
}
