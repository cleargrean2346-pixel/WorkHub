import type { Metadata } from 'next';
import '../style.css';

export const metadata: Metadata = {
  title: 'WorkHub · 업무의 흐름을 하나로',
  description: '팀을 위한 지식과 업무의 중심',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
