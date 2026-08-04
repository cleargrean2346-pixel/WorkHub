'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(localStorage.getItem('workhub-cookie-notice') !== 'accepted'); }, []);
  if (!visible) return null;
  return <aside className="cookie-consent" role="region" aria-label="쿠키 안내"><div><b>필수 쿠키 안내</b><p>WorkHub는 로그인과 보안을 위해 필수 쿠키만 사용합니다. <Link href="/cookies">쿠키 정책</Link></p></div><button className="primary" type="button" onClick={() => { localStorage.setItem('workhub-cookie-notice', 'accepted'); setVisible(false); }}>확인</button></aside>;
}
