'use client';

import { useEffect, useState } from 'react';

export default function BrowserNotificationControl() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');

  useEffect(() => {
    if ('Notification' in window) { setSupported(true); setPermission(Notification.permission); }
  }, []);

  async function requestPermission() {
    if (!supported) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') new Notification('WorkHub 브라우저 알림이 켜졌습니다.', { body: '새 댓글, 업무, 승인 상태를 이 브라우저에서 알려드립니다.' });
  }

  const label = permission === 'granted' ? '허용됨' : permission === 'denied' ? '차단됨' : permission === 'default' ? '미설정' : '지원하지 않음';
  return <fieldset><legend>브라우저 알림</legend><p>현재 상태: <b>{label}</b></p>{permission === 'granted' ? <p>브라우저 알림을 켰습니다. 브라우저 또는 운영체제 설정에서 언제든 변경할 수 있습니다.</p> : <button className="secondary" type="button" onClick={requestPermission} disabled={!supported || permission === 'denied'}>{permission === 'denied' ? '브라우저 설정에서 차단 해제' : '브라우저 알림 허용'}</button>}</fieldset>;
}
