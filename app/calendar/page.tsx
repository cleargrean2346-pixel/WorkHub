import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import styles from './calendar.module.css';

type Task = { id: string; title: string; start_at: string | null; due_at: string | null; status: string; priority: string; reminder_at: string | null; recurrence: string | null };
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
const dateKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
  if (!membership) redirect('/workspace');
  const { data: rows } = await supabase.from('work_tasks').select('id,title,start_at,due_at,status,priority,reminder_at,recurrence').eq('organization_id', membership.organization_id).is('archived_at', null).order('due_at');
  const tasks = (rows ?? []) as Task[];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const dated = tasks.filter((task) => task.start_at || task.due_at);
  const overdue = dated.filter((task) => task.due_at && new Date(task.due_at) < now && task.status !== 'done');
  const dueToday = dated.filter((task) => task.due_at && new Date(task.due_at) >= now && new Date(task.due_at) < tomorrow && task.status !== 'done');
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const gridStart = new Date(monthStart); gridStart.setDate(1 - monthStart.getDay());
  const days = Array.from({ length: 42 }, (_, index) => { const date = new Date(gridStart); date.setDate(gridStart.getDate() + index); return date; });
  const tasksForDay = (day: Date) => dated.filter((task) => dateKey(new Date(task.due_at || task.start_at!)) === dateKey(day));

  return <main className="workspace-page"><header className="workspace-header"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><div><strong>일정</strong><small>{dated.length}개의 일정 업무</small></div><Link className="back-link" href="/tasks">업무</Link></header><section className="workspace-content"><div className="workspace-intro"><p className="eyebrow"><span /> SCHEDULE</p><h1>{now.getFullYear()}년 {now.getMonth() + 1}월</h1><p>업무의 시작일과 마감일을 한눈에 확인하고, 업무를 열어 일정을 수정하세요.</p></div><section className="workspace-grid"><article className="workspace-panel"><h2>기한 초과</h2><p>{overdue.length}</p></article><article className="workspace-panel"><h2>오늘 마감</h2><p>{dueToday.length}</p></article><article className="workspace-panel"><h2>일정 등록</h2><p>{dated.length}</p></article></section><section className={`workspace-panel ${styles.calendarPanel}`}><div className="workspace-panel-title"><h2>월간 일정</h2><Link href="/tasks">업무 관리</Link></div><div className={styles.calendar}>{weekDays.map((day) => <b className={styles.weekDay} key={day}>{day}</b>)}{days.map((day) => { const dailyTasks = tasksForDay(day); const inMonth = day.getMonth() === now.getMonth(); const isToday = dateKey(day) === dateKey(now); return <div className={`${styles.day} ${!inMonth ? styles.muted : ''} ${isToday ? styles.today : ''}`} key={dateKey(day)}><span>{day.getDate()}</span><div>{dailyTasks.slice(0, 3).map((task) => <Link href={`/tasks/${task.id}`} className={`${styles.task} ${styles[task.priority] || ''}`} key={task.id} title={task.title}>{task.title}</Link>)}{dailyTasks.length > 3 && <small>+{dailyTasks.length - 3}개 더</small>}</div></div>; })}</div></section><section className="workspace-panel"><div className="workspace-panel-title"><h2>다가오는 업무</h2><Link href="/tasks">업무 관리</Link></div>{dated.length ? <div className="live-tasks">{dated.slice(0, 12).map((task) => <Link className="live-task" href={`/tasks/${task.id}`} key={task.id}><div><b>{task.title}</b><small>{task.start_at || '시작일 없음'} → {task.due_at || '마감일 없음'} · {task.status} · {task.priority}{task.recurrence ? ` · 반복 ${task.recurrence}` : ''}{task.reminder_at ? ` · 알림 ${new Date(task.reminder_at).toLocaleString('ko-KR')}` : ''}</small></div></Link>)}</div> : <div className="empty-state">일정이 등록된 업무가 없습니다. 업무 상세에서 시작일 또는 마감일을 추가해 보세요.</div>}</section></section></main>;
}
