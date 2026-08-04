'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export async function deactivateMyAccount(formData: FormData) { if (String(formData.get('confirmation') ?? '') !== '비활성화') throw new Error('확인 문구가 일치하지 않습니다.'); const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login'); const { error } = await supabase.rpc('deactivate_my_account'); if (error) throw new Error('계정을 비활성화하지 못했습니다. 데이터베이스 마이그레이션 적용 여부를 확인하세요.'); await supabase.auth.signOut(); redirect('/'); }
