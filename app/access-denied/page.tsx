import Link from 'next/link';

export default function AccessDeniedPage() {
  return <main className="onboarding"><section className="onboarding-card"><p className="eyebrow"><span /> 접근 제한</p><h1>보호된 링크에 접근할 수 없습니다</h1><p>승인된 워크스페이스 계정으로 로그인한 뒤 다시 시도하세요. 링크가 비활성화되었거나 권한이 없다면 관리자에게 확인을 요청할 수 있습니다.</p><div className="hero-actions"><Link className="primary" href="/login">로그인</Link><Link className="secondary" href="/">홈으로</Link></div></section></main>;
}
