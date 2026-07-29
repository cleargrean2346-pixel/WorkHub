import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type AuditLog = { id: string; action: string; target_type: string | null; target_id: string | null; created_at: string };
export default async function AuditLogPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership || !['organization_admin', 'system_admin'].includes(membership.role)) return <main className="onboarding"><section className="onboarding-card"><h1>Administrator access required</h1><Link className="primary" href="/workspace">Back to workspace</Link></section></main>;
  const { data: rows } = await supabase.from('audit_logs').select('id, action, target_type, target_id, created_at').eq('organization_id', membership.organization_id).order('created_at', { ascending: false }).limit(100);
  const logs = (rows ?? []) as AuditLog[];
  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>Audit log</strong><small>Administrative activity</small></div><Link className="back-link" href="/workspace">Workspace</Link></header><section className="workspace-content"><section className="workspace-panel"><div className="workspace-panel-title"><h1>Audit log</h1><span>{logs.length}</span></div><div className="live-tasks">{logs.map((log) => <div className="live-task" key={log.id}><div><b>{log.action}</b><small>{log.target_type || 'system'} · {log.target_id || ''} · {new Date(log.created_at).toLocaleString('ko-KR')}</small></div></div>)}</div></section></section></main>;
}
