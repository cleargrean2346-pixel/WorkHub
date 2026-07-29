'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const googleLogin = async () => {
    setLoading(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setNotice(error.message); setLoading(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setNotice(error ? error.message : '로그인 링크를 이메일로 보냈습니다. 이메일을 확인해 주세요.');
    setLoading(false);
  };

  return <main className="login-page"><section className="login-card">
    <a className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></a>
    <p className="eyebrow"><span /> SECURE WORKSPACE</p>
    <h1>WorkHub에 로그인</h1>
    <p className="login-copy">Google 계정 또는 이메일 링크로 안전하게 로그인하세요.</p>
    <button type="button" className="oauth-button" onClick={googleLogin} disabled={loading}><span className="google-g">G</span> Google로 계속하기</button>
    <div className="divider"><span>또는 이메일로</span></div>
    <form onSubmit={submit}>
      <label htmlFor="email">이메일 주소</label>
      <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoComplete="email" />
      <button className="primary login-button" disabled={loading}>{loading ? '전송 중…' : '로그인 링크 받기'} <span>→</span></button>
    </form>
    {notice && <p className="login-notice" role="status">{notice}</p>}
    <p className="login-footnote">계속 진행하면 WorkHub 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주합니다.</p>
  </section></main>;
}
