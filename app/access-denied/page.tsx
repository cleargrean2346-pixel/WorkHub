import Link from 'next/link';

export default function AccessDeniedPage() {
  return <main className="onboarding"><section className="onboarding-card"><p className="eyebrow"><span /> ACCESS DENIED</p><h1>This protected link is unavailable</h1><p>Sign in with an approved workspace account, or ask an administrator to check that the link is still active and that you have access.</p><div className="hero-actions"><Link className="primary" href="/login">Log in</Link><Link className="secondary" href="/">Back to home</Link></div></section></main>;
}
