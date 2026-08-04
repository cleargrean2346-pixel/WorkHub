import type { Metadata } from 'next';
import '../style.css';
import CookieConsent from './cookie-consent';
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://work-hub-ashen.vercel.app';
export const metadata: Metadata = { metadataBase: new URL(siteUrl), title: { default: 'WorkHub', template: '%s | WorkHub' }, description: '팀의 업무, 문서, 지식을 한곳에서 관리하는 WorkHub', alternates: { canonical: '/' }, openGraph: { type: 'website', locale: 'ko_KR', siteName: 'WorkHub', title: 'WorkHub', description: '팀의 업무, 문서, 지식을 한곳에서 관리하세요.' }, twitter: { card: 'summary', title: 'WorkHub', description: '팀의 업무, 문서, 지식을 한곳에서 관리하세요.' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><div id="main-content">{children}</div><CookieConsent /></body></html>; }
