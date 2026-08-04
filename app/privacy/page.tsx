import Link from 'next/link';

export const metadata = { title: '개인정보 처리방침' };

export default function Privacy() {
  return <main className="onboarding"><section className="onboarding-card">
    <Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link>
    <p className="eyebrow"><span /> PRIVACY</p><h1>개인정보 처리방침</h1>
    <p>WorkHub는 로그인, 협업, 보안 운영에 필요한 최소한의 계정 및 워크스페이스 정보를 처리합니다.</p>
    <h2>처리하는 정보</h2><p>이메일, 프로필 정보, 사용자가 작성한 게시글·댓글·업무·파일 메타데이터와 서비스 알림 기록입니다.</p>
    <h2>보관과 보호</h2><p>데이터는 조직별 접근 권한으로 분리되며, 승인된 구성원만 해당 조직의 비공개 정보를 볼 수 있습니다.</p>
    <h2>내 데이터 내려받기</h2><p>로그인한 사용자는 본인 계정에 연결된 게시글, 댓글, 반응, 업무, 알림을 JSON 파일로 내려받을 수 있습니다.</p>
    <a className="primary" href="/api/me/export">내 데이터 내려받기</a>
    <h2>정정·삭제 요청</h2><p>프로필 정보는 프로필 편집에서 수정할 수 있습니다. 계정 또는 조직 데이터 삭제는 조직 관리자에게 요청해 주세요. 법적 보관 의무가 없는 데이터는 요청 처리 후 삭제 또는 익명화됩니다.</p>
    <div className="hero-actions"><Link className="secondary" href="/settings/profile">프로필 편집</Link><Link className="back-link" href="/">홈으로</Link></div>
  </section></main>;
}
