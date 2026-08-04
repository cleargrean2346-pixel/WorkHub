import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const [{ data: profile }, { data: posts }, { data: comments }, { data: likes }, { data: bookmarks }, { data: tasks }, { data: notifications }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,avatar_url,created_at,updated_at').eq('id', user.id).maybeSingle(),
    supabase.from('posts').select('id,title,body,excerpt,status,created_at,updated_at').eq('author_id', user.id).order('created_at', { ascending: false }),
    supabase.from('comments').select('id,post_id,body,created_at,updated_at').eq('author_id', user.id).order('created_at', { ascending: false }),
    supabase.from('likes').select('post_id,created_at').eq('user_id', user.id),
    supabase.from('bookmarks').select('post_id,created_at').eq('user_id', user.id),
    supabase.from('work_tasks').select('id,title,description,status,priority,due_at,created_at,updated_at').or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`).order('created_at', { ascending: false }),
    supabase.from('notifications').select('id,kind,title,body,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, profile },
    content: { posts: posts ?? [], comments: comments ?? [], likes: likes ?? [], bookmarks: bookmarks ?? [] },
    work: { tasks: tasks ?? [] },
    notifications: notifications ?? [],
  };
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="workhub-data-${date}.json"`, 'cache-control': 'no-store' } });
}
