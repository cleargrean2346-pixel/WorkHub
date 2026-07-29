import Link from 'next/link';

export default function AccessDeniedPage() {
  return <main className="onboarding"><section className="onboarding-card"><p className="eyebrow"><span /> ACCESS DENIED</p><h1>This protected link is unavailable</h1><p>Sign in with an approved workspace account, or ask an administrator to check the link.</p><Link className="primary" href="/">Back to dashboard</Link></section></main>;
}
