'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('workhub-theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('workhub-theme') as Theme | null;
    const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const next = saved === 'dark' || saved === 'light' ? saved : preferred;
    setTheme(next);
    applyTheme(next);
  }, []);

  return <button className="theme-toggle" type="button" onClick={() => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); applyTheme(next); }} aria-label={theme === 'dark' ? '밝은 테마로 전환' : '어두운 테마로 전환'} title={theme === 'dark' ? '밝은 테마' : '어두운 테마'}>{theme === 'dark' ? '☀' : '◐'}</button>;
}
