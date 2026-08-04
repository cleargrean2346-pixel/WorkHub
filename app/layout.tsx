import type { Metadata } from 'next';
import '../style.css';
import CookieConsent from './cookie-consent';

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://work-hub-ashen.vercel.app'), title: { default: 'WorkHub', template: '%s | WorkHub' }, description: 'Workspace for teams', alternates: { canonical: '/' }, openGraph: { type: 'website', locale: 'ko_KR', siteName: 'WorkHub', title: 'WorkHub', description: 'Workspace for teams' }, twitter: { card: 'summary', title: 'WorkHub', description: 'Workspace for teams' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><div id="main-content">{children}</div><CookieConsent /></body></html>; }
