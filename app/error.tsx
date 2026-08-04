'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> 오류</p><h1>화면을 불러오지 못했습니다</h1><p>일시적인 연결 문제일 수 있습니다. 다시 시도하거나 홈으로 이동해 주세요.</p><div className="hero-actions"><button className="primary" onClick={reset}>다시 시도</button><Link className="secondary" href="/">홈으로</Link></div></section></main>;
}
