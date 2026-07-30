import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type NaverProfileResponse = {
  resultcode?: string;
  message?: string;
  response?: { id?: string; email?: string; nickname?: string; name?: string; profile_image?: string };
};

function loginError(request: Request, reason: string) {
  const url = new URL('/login', request.url);
  url.searchParams.set('error', reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = (await cookies()).get('workhub_naver_state')?.value;
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!code || !state || !storedState || state !== storedState) return loginError(request, 'naver_state_invalid');
  if (!clientId || !clientSecret || !supabaseUrl || !serviceRoleKey) return loginError(request, 'naver_not_configured');

  const callbackUrl = new URL('/auth/naver/callback', request.url).toString();
  const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token');
  tokenUrl.searchParams.set('grant_type', 'authorization_code');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('code', code);
  tokenUrl.searchParams.set('state', state);

  const tokenResponse = await fetch(tokenUrl, { cache: 'no-store' });
  const token = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !token.access_token) return loginError(request, 'naver_token_failed');

  const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: 'no-store',
  });
  const profile = (await profileResponse.json()) as NaverProfileResponse;
  const naverId = profile.response?.id;
  if (!profileResponse.ok || profile.resultcode !== '00' || !naverId) return loginError(request, 'naver_profile_failed');

  // Naver may not return an email when the user has not consented to share it.
  // The generated address is only an internal Supabase identity and is never used for mail delivery.
  const email = profile.response?.email?.trim().toLowerCase() || `naver-${naverId}@users.workhub.local`;
  const fullName = profile.response?.nickname || profile.response?.name || 'Naver user';
  const admin = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, avatar_url: profile.response?.profile_image, naver_id: naverId },
  });
  if (createError && !/already (been )?registered|already exists/i.test(createError.message)) return loginError(request, 'naver_account_failed');

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: new URL('/auth/callback', request.url).toString() },
  });
  if (linkError || !link.properties?.action_link) return loginError(request, 'naver_session_failed');

  const response = NextResponse.redirect(link.properties.action_link);
  response.cookies.set('workhub_naver_state', '', { maxAge: 0, path: '/' });
  return response;
}
