'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import HomeSidebarProfile from './home-sidebar-profile';
import HomeSidebarCategories from './home-sidebar-categories';
import './home.css';

const tasks = [
  ['Finalize user page review', 'High priority · Design system', 'Today, 11:00'],
  ['Prepare Q3 marketing brief', 'Medium priority · Marketing', 'Today, 14:00'],
  ['Update onboarding guide', 'Low priority · People', 'Today, 17:00'],
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
      <HomeSidebarProfile />
      <nav aria-label="Main navigation">
        <p className="nav-label">WORKSPACE</p>
        <a className="nav-item active" href="#overview">Overview</a>
        <a className="nav-item" href="#tasks">My tasks <b className="blue">{tasks.length}</b></a>
        <a className="nav-item" href="#calendar">Calendar</a>
        <HomeSidebarCategories />
        <p className="nav-label second">KNOWLEDGE</p>
        <a className="nav-item" href="/posts">Posts</a>
        <a className="nav-item" href="/documents">Documents</a>
      </nav>
      <div className="sidebar-bottom">{email ? <><button className="upgrade" onClick={goToWorkspace}><div><strong>Open my workspace</strong><small>{email}</small></div></button><button className="text-button" onClick={logout}>Log out</button></> : <button className="upgrade" onClick={goToWorkspace}><div><strong>Log in to get started</strong><small>Use Google or email</small></div></button>}</div>
    </aside>
    <main>
      <header><div className="crumb">Overview</div></header>
      <section className="hero" id="overview"><div><p className="eyebrow"><span /> WORKHUB</p><h1>{email ? 'You are signed in' : 'Plan work with clarity'}, <em>✦</em></h1><p className="hero-copy">{email ? `${email} is signed in.` : 'Organize work, share team knowledge, and keep progress visible.'}</p><div className="hero-actions"><button className="primary" onClick={goToWorkspace}>{email ? 'Open workspace' : 'Log in'}</button></div></div><div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="glow"/><div className="hero-symbol">✦</div></div></section>
      <section className="metrics"><article><strong>12</strong><p>Completed work <span>This week</span></p><div className="progress"><i style={{ width: '74%' }}/></div></article><article><strong>8</strong><p>In progress</p></article><article><strong>3</strong><p>Upcoming deadlines</p></article></section>
      <section className="content-grid"><div className="panel tasks" id="tasks"><div className="panel-title"><div><h2>My tasks</h2><p>Keep today&apos;s important work in view.</p></div></div><div className="task-list">{tasks.map(([title, detail, due], index) => <label className={`task ${completed.includes(index) ? 'done' : ''}`} key={title}><input type="checkbox" checked={completed.includes(index)} onChange={() => toggle(index)}/><span className="check">{completed.includes(index) ? '✓' : ''}</span><span className="task-text"><b>{title}</b><small>{detail}</small></span><span className="due">{due}</span></label>)}</div></div><div className="side-column"><div className="panel schedule" id="calendar"><div className="panel-title"><div><h2>Today&apos;s schedule</h2><p>July 29, Tuesday</p></div></div><div className="meeting"><span className="time">10:00</span><div><b>Design sync</b><p>Google Meet · 4 people</p></div></div><div className="meeting"><span className="time">15:30</span><div><b>Product roadmap review</b><p>Zoom · 8 people</p></div></div></div></div></section>
    </main>
  </div>;
}
