'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const tasks = [
  ['랜딩 페이지 최종 디자인 검토', 'High priority · Design system', '오늘, 11:00'],
  ['Q3 마케팅 캠페인 브리프 작성', 'Medium priority · Marketing', '오늘, 14:00'],
  ['신규 입사자 온보딩 문서 업데이트', 'Low priority · People', '오늘, 17:00'],
];

export default function Home() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const login = async () => {
    const email = window.prompt('로그인 링크를 받을 이메일 주소를 입력하세요.');
    if (!email) return;
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setMessage(error ? `오류: ${error.message}` : '로그인 링크를 이메일로 보냈습니다.');
  };
  const toggle = (index: number) => setCompleted(current => current.includes(index) ? current.filter(i => i !== index) : [...current, index]);
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#"><span className="brand-mark">W</span><span>workhub</span></a><div className="workspace"><span className="avatar gradient">J</span><div><strong>Jupiter Labs</strong><small>Enterprise plan</small></div></div><nav aria-label="주 메뉴"><p className="nav-label">WORKSPACE</p><a className="nav-item active" href="#overview"><span>⌘</span>Overview</a><a className="nav-item" href="#tasks"><span>✓</span>My tasks <b className="blue">7</b></a><a className="nav-item" href="#calendar"><span>□</span>Calendar</a><p className="nav-label second">KNOWLEDGE</p><a className="nav-item" href="#documents"><span>▤</span>Documents</a><a className="nav-item" href="#members"><span>♧</span>Members</a></nav><div className="sidebar-bottom"><button className="upgrade" onClick={login}><span>✦</span><div><strong>로그인 시작</strong><small>이메일 매직 링크 사용</small></div><i>›</i></button></div></aside>
    <main><header><button className="mobile-menu" aria-label="메뉴">☰</button><div className="crumb">Jupiter Labs <span>/</span> <strong>Overview</strong></div><div className="header-actions"><button className="help" onClick={login}>로그인</button></div></header>
      <section className="hero" id="overview"><div><p className="eyebrow"><span /> WORKHUB</p><h1>좋은 아침이에요, 민님 <em>✦</em></h1><p className="hero-copy">오늘은 3개의 우선순위 작업과 2개의 미팅이 있어요.<br />집중해서 멋진 하루를 만들어 봐요.</p><div className="hero-actions"><button className="primary" onClick={() => setMessage('새 작업 작성 기능은 로그인 후 사용할 수 있습니다.')}>+ 새 작업</button><button className="secondary">내 캘린더 보기 <span>→</span></button></div></div><div className="hero-art"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="glow" /><div className="hero-symbol">✦</div></div></section>
      <section className="metrics"><article><div className="metric-top"><span className="metric-icon lavender">✓</span><span className="trend up">↗ 12%</span></div><strong>12</strong><p>완료한 작업 <span>이번 주</span></p><div className="progress"><i style={{ width: '74%' }} /></div></article><article><div className="metric-top"><span className="metric-icon mint">◌</span><span className="trend neutral">+2 today</span></div><strong>8</strong><p>진행 중인 작업</p></article><article><div className="metric-top"><span className="metric-icon peach">□</span><span className="trend down">2 this week</span></div><strong>3</strong><p>다가오는 마감일</p></article></section>
      <section className="content-grid"><div className="panel tasks" id="tasks"><div className="panel-title"><div><h2>My tasks</h2><p>오늘 해야 할 일들을 확인하세요</p></div><button className="text-button">모두 보기 →</button></div><div className="tabs"><button className="selected">오늘 <b>3</b></button><button>다가오는 일정 <b>7</b></button></div><div className="task-list">{tasks.map(([title, detail, due], index) => <label className={`task ${completed.includes(index) ? 'done' : ''}`} key={title}><input type="checkbox" checked={completed.includes(index)} onChange={() => toggle(index)} /><span className="check">{completed.includes(index) ? '✓' : ''}</span><span className="task-text"><b>{title}</b><small>{detail}</small></span><span className="due">{due}</span></label>)}</div><button className="add-task" onClick={() => setMessage('작업 생성은 Supabase 로그인 연결 후 활성화됩니다.')}>＋ 작업 추가</button></div><div className="side-column"><div className="panel schedule" id="calendar"><div className="panel-title"><div><h2>오늘의 일정</h2><p>7월 29일, 화요일</p></div></div><div className="meeting"><span className="time">10:00<br /><small>10:30</small></span><i className="meeting-line purple" /><div><b>Design sync</b><p>Google Meet · 4명</p></div></div><div className="meeting"><span className="time">15:30<br /><small>16:30</small></span><i className="meeting-line blue-line" /><div><b>Product roadmap review</b><p>Zoom · 8명</p></div></div></div></div></section>
    </main>{message && <div className="toast show" role="status">{message}<button onClick={() => setMessage('')} aria-label="닫기">×</button></div>}</div>;
}
