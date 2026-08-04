import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: approved } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (approved) redirect('/');

  return <main className="onboarding"><section className="onboarding-card">
    <Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link>
    <p className="eyebrow"><span /> ACCESS REVIEW</p>
    <h1>승인 대기 중입니다</h1>
    <p>관리자가 계정을 확인한 뒤 워크스페이스 접근을 승인합니다. 승인 후 다시 로그인하면 바로 홈 화면으로 이동합니다.</p>
    <Link className="back-link" href="/login">로그인 화면으로 돌아가기</Link>
  </section></main>;
}
