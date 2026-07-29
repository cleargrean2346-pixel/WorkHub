import type { Metadata } from 'next';
import '../style.css';

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://work-hub-ashen.vercel.app'), title: { default: 'WorkHub', template: '%s | WorkHub' }, description: 'Workspace for teams', alternates: { canonical: '/' }, openGraph: { type: 'website', locale: 'ko_KR', siteName: 'WorkHub', title: 'WorkHub', description: 'Workspace for teams' }, twitter: { card: 'summary', title: 'WorkHub', description: 'Workspace for teams' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
