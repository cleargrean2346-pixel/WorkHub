import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { saveProfile } from './actions';

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url, email').eq('id', user.id).maybeSingle();
  return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> ACCOUNT SETTINGS</p><h1>Profile</h1><p>Your sign-in email: {profile?.email || user.email}</p><p>Update the name and avatar shown to other workspace members.</p>{profile?.avatar_url && <img src={profile.avatar_url} alt="Profile avatar" width={72} height={72} style={{ borderRadius: '50%', objectFit: 'cover' }} />}<form action={saveProfile}><label htmlFor="fullName">Display name</label><input id="fullName" name="fullName" defaultValue={profile?.full_name || ''} required maxLength={80} placeholder="Your name"/><label htmlFor="avatarUrl">Avatar image URL (optional)</label><input id="avatarUrl" name="avatarUrl" type="url" defaultValue={profile?.avatar_url || ''} placeholder="https://example.com/avatar.png"/><button className="primary">Save profile</button></form><Link className="back-link" href="/me">Back to my page</Link></section></main>;
}
