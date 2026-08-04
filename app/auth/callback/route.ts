import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL('/login?error=oauth', url.origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', url.origin));

  const { data: approved } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (approved) return NextResponse.redirect(new URL('/', url.origin));

  // 신규 계정은 기본 워크스페이스에 승인 대기 구성원으로 등록한다.
  await supabase.rpc('request_default_organization_access');
  return NextResponse.redirect(new URL('/pending', url.origin));
}
