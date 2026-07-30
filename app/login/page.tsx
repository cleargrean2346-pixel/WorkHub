'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/');
    });
  }, [router]);

  const signInWithProvider = async (provider: string, label: string) => {
    setLoading(true);
    setNotice('');

    const { data, error } = await createClient().auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setNotice(`${label} 로그인 오류: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setNotice(`${label} 로그인 주소를 만들지 못했습니다. Supabase provider 설정을 확인하세요.`);
    setLoading(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice('');

    try {
      const { error } = await createClient().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });

      const message = typeof error?.message === 'string' ? error.message.trim() : '';
      const errorMessage =
        message && message !== '{}'
          ? message
          : typeof error?.code === 'string'
            ? error.code
            : 'SMTP 설정 또는 발신 이메일을 확인해 주세요.';

      setNotice(error ? `로그인 링크 전송 오류: ${errorMessage}` : '로그인 링크를 이메일로 보냈습니다. 받은 편지함과 스팸함을 확인해 주세요.');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message.trim() : '';
      setNotice(`로그인 링크 전송 오류: ${message && message !== '{}' ? message : 'SMTP 설정 또는 네트워크 연결을 확인해 주세요.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <Link className="brand" href="/">
          <span className="brand-mark">W</span>
          <span>workhub</span>
        </Link>
        <p className="eyebrow">
          <span /> SECURE WORKSPACE
        </p>
        <h1>WorkHub 로그인</h1>
        <p className="login-copy">Google 계정, 네이버 계정, 또는 이메일 로그인 링크로 안전하게 시작하세요.</p>

        <button type="button" className="oauth-button google-button" onClick={() => signInWithProvider('google', 'Google')} disabled={loading}>
          <span className="google-g">G</span> Google로 계속하기
        </button>
        <button type="button" className="oauth-button naver-button" onClick={() => window.location.assign('/auth/naver')} disabled={loading}>
          <span className="naver-b">N</span> 네이버로 계속하기
        </button>

        <div className="divider">
          <span>또는 이메일로</span>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="email">이메일 주소</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required autoComplete="email" />
          <button className="primary login-button" disabled={loading}>
            {loading ? '전송 중…' : '로그인 링크 받기'}
          </button>
        </form>

        {notice && <p className="login-notice" role="status">{notice}</p>}
        <p className="login-footnote">계속 진행하면 WorkHub 이용약관과 개인정보 처리방침에 동의하게 됩니다.</p>
      </section>
    </main>
  );
}
