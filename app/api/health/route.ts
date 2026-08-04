import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('organizations').select('id').limit(1);
    if (error) return NextResponse.json({ ok: false, service: 'workhub', database: 'unavailable', checkedAt: new Date().toISOString() }, { status: 503, headers: { 'cache-control': 'no-store' } });
    return NextResponse.json({ ok: true, service: 'workhub', database: 'available', latencyMs: Date.now() - started, checkedAt: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, service: 'workhub', database: 'unavailable', checkedAt: new Date().toISOString() }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
