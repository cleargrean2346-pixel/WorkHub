import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const { data, error } = await supabase.rpc('resolve_protected_url', { token });
  if (error || !data || !/^https:\/\//.test(data)) return NextResponse.redirect(new URL('/access-denied', request.url));
  return NextResponse.redirect(data);
}
