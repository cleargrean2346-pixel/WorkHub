import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { saveProfile } from './actions';

const avatars = [
  ['none', '이미지 없음'], ['https://api.dicebear.com/9.x/avataaars/svg?seed=WorkHub-1', '파란 탐험가'], ['https://api.dicebear.com/9.x/avataaars/svg?seed=WorkHub-2', '보라 창작가'], ['https://api.dicebear.com/9.x/avataaars/svg?seed=WorkHub-3', '초록 사고가'], ['https://api.dicebear.com/9.x/avataaars/svg?seed=WorkHub-4', '주황 제작자'], ['https://api.dicebear.com/9.x/bottts/svg?seed=WorkHub-5', '팀 봇'], ['https://api.dicebear.com/9.x/bottts/svg?seed=WorkHub-6', '우주 봇'], ['https://api.dicebear.com/9.x/pixel-art/svg?seed=WorkHub-7', '픽셀 프로필'],
] as const;

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('full_name,avatar_url,email').eq('id', user.id).maybeSingle();
  const selected = avatars.some(([value]) => value === profile?.avatar_url) ? profile?.avatar_url : 'none';
  return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> 계정 설정</p><h1>프로필 편집</h1><p>로그인 이메일: {profile?.email || user.email}</p><p>워크스페이스 구성원에게 보이는 이름과 이미지를 설정하세요.</p>{profile?.avatar_url && <img src={profile.avatar_url} alt="현재 프로필 이미지" width={88} height={88} style={{ borderRadius: '50%', objectFit: 'cover', margin: '8px 0' }} />}<form action={saveProfile}><label htmlFor="fullName">표시 이름</label><input id="fullName" name="fullName" defaultValue={profile?.full_name || ''} required maxLength={80} placeholder="이름"/><label htmlFor="avatarUrl">프로필 이미지</label><select id="avatarUrl" name="avatarUrl" defaultValue={selected}>{avatars.map(([value, label]) => <option value={value === 'none' ? '' : value} key={value}>{label}</option>)}</select><button className="primary">프로필 저장</button></form><Link className="back-link" href="/me">마이페이지로</Link></section></main>;
}
