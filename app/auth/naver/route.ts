import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const callbackUrl = new URL('/auth/naver/callback', request.url).toString();

  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=naver_not_configured', request.url));
  }

  const state = crypto.randomUUID();
  const authorizeUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizeUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set('workhub_naver_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });
  return response;
}
