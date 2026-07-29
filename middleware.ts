import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
export async function middleware(request: NextRequest) { return updateSession(request); }
export const config = { matcher: ['/workspace/:path*', '/settings/:path*', '/posts/:path*', '/manage/:path*', '/requests/:path*', '/notifications/:path*', '/tasks/:path*', '/me/:path*'] };
