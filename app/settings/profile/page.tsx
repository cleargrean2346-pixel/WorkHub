import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { saveProfile } from './actions';

const avatars = [
  ['none', 'No avatar'],
  ['https://api.dicebear.com/9.x/avataaars/svg?seed=WorkHub-1', 'Blue explorer'],
  ['https://api.dicebear.com/9.x/avataaars/svg?seed=WorkHub-2', 'Purple creator'],
  ['https://api.dicebear.com/9.x/avataaars/svg?seed=WorkHub-3', 'Green thinker'],
  ['https://api.dicebear.com/9.x/avataaars/svg?seed=WorkHub-4', 'Orange builder'],
  ['https://api.dicebear.com/9.x/bottts/svg?seed=WorkHub-5', 'Team bot'],
  ['https://api.dicebear.com/9.x/bottts/svg?seed=WorkHub-6', 'Space bot'],
  ['https://api.dicebear.com/9.x/pixel-art/svg?seed=WorkHub-7', 'Pixel portrait'],
] as const;

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('full_name,avatar_url,email').eq('id', user.id).maybeSingle();
  const selected = avatars.some(([value]) => value === profile?.avatar_url) ? profile?.avatar_url : 'none';
  return <main className="onboarding"><section className="onboarding-card">
    <Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link>
    <p className="eyebrow"><span /> ACCOUNT SETTINGS</p><h1>Edit profile</h1><p>Your sign-in email: {profile?.email || user.email}</p><p>Choose the name and avatar shown to workspace members.</p>
    {profile?.avatar_url && <img src={profile.avatar_url} alt="Current profile avatar" width={88} height={88} style={{ borderRadius: '50%', objectFit: 'cover', margin: '8px 0' }} />}
    <form action={saveProfile}>
      <label htmlFor="fullName">Display name</label><input id="fullName" name="fullName" defaultValue={profile?.full_name || ''} required maxLength={80} placeholder="Your name"/>
      <label htmlFor="avatarUrl">Profile image</label><select id="avatarUrl" name="avatarUrl" defaultValue={selected}>{avatars.map(([value, label]) => <option value={value === 'none' ? '' : value} key={value}>{label}</option>)}</select>
      <button className="primary">Save profile</button>
    </form>
    <Link className="back-link" href="/me">Back to my page</Link>
  </section></main>;
}
