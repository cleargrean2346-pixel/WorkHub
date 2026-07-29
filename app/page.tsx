'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const tasks = [
  ['디자인 페이지 최종 사용자 검토', 'High priority · Design system', '오늘, 11:00'],
  ['Q3 마케팅 캠페인 브리프 작성', 'Medium priority · Marketing', '오늘, 14:00'],
  ['신규 입사자 온보딩 문서 업데이트', 'Low priority · People', '오늘, 17:00'],
];

export default function Home() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const goToWorkspace = () => { window.location.href = email ? '/workspace' : '/login'; };
  const logout = async () => { await createClient().auth.signOut(); setEmail(null); };
  const toggle = (index: number) => setCompleted((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></a>
      <div className="workspace"><span className="avatar gradient">J</span><div><strong>Jupiter Labs</strong><small>Enterprise plan</small></div></div>
      <nav aria-label="주 메뉴"><p className="nav-label">WORKSPACE</p><a className="nav-item active" href="#overview">Overview</a><a className="nav-item" href="#tasks">My tasks <b className="blue">7</b></a><a className="nav-item" href="#calendar">Calendar</a><p className="nav-label second">KNOWLEDGE</p><a className="nav-item" href="#documents">Documents</a><a className="nav-item" href="#members">Members</a></nav>
      <div className="sidebar-bottom">{email ? <><button className="upgrade" onClick={goToWorkspace}><div><strong>내 공간으로 이동</strong><small>{email}</small></div></button><button className="text-button" onClick={logout}>로그아웃</button></> : <button className="upgrade" onClick={goToWorkspace}><div><strong>로그인하고 시작</strong><small>Google 또는 이메일로 로그인</small></div></button>}</div>
    </aside>
    <main>
      <header><div className="crumb">Jupiter Labs <span>/</span> <strong>Overview</strong></div><div className="header-actions"><button className="help" onClick={goToWorkspace}>{email ? '내 공간' : '로그인'}</button></div></header>
      <section className="hero" id="overview"><div><p className="eyebrow"><span /> WORKHUB</p><h1>{email ? '로그인되었습니다' : '좋은 아침이에요'}, <em>✦</em></h1><p className="hero-copy">{email ? `${email} 계정으로 로그인 중입니다.` : '할 일을 정리하고 팀과 함께 더 나은 하루를 만들어 보세요.'}</p><div className="hero-actions"><button className="primary" onClick={goToWorkspace}>{email ? '내 공간 열기' : '로그인하기'}</button></div></div><div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="glow"/><div className="hero-symbol">✦</div></div></section>
      <section className="metrics"><article><strong>12</strong><p>완료한 작업 <span>이번 주</span></p><div className="progress"><i style={{ width: '74%' }}/></div></article><article><strong>8</strong><p>진행 중인 작업</p></article><article><strong>3</strong><p>다가오는 마감일</p></article></section>
      <section className="content-grid"><div className="panel tasks" id="tasks"><div className="panel-title"><div><h2>My tasks</h2><p>오늘 해야 할 일들을 확인하세요.</p></div></div><div className="task-list">{tasks.map(([title, detail, due], index) => <label className={`task ${completed.includes(index) ? 'done' : ''}`} key={title}><input type="checkbox" checked={completed.includes(index)} onChange={() => toggle(index)}/><span className="check">{completed.includes(index) ? '✓' : ''}</span><span className="task-text"><b>{title}</b><small>{detail}</small></span><span className="due">{due}</span></label>)}</div></div><div className="side-column"><div className="panel schedule" id="calendar"><div className="panel-title"><div><h2>오늘의 일정</h2><p>7월 29일, 화요일</p></div></div><div className="meeting"><span className="time">10:00</span><div><b>Design sync</b><p>Google Meet · 4명</p></div></div><div className="meeting"><span className="time">15:30</span><div><b>Product roadmap review</b><p>Zoom · 8명</p></div></div></div></div></section>
    </main>
  </div>;
}
