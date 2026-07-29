'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export async function moderateComment(formData: FormData) { const id=String(formData.get('id')??''); if(!id)return; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect('/login'); const {error}=await supabase.from('comments').delete().eq('id',id); if(error)throw new Error('Unable to delete comment.'); revalidatePath('/manage/comments'); }
