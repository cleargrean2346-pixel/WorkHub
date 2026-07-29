'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ProfileState = { name: string; role: string; avatarUrl: string | null } | null;

const roleLabel: Record<string, string> = {
  system_admin: 'System administrator',
  organization_admin: 'Organization administrator',
  manager: 'Manager',
  team_leader: 'Team leader',
  member: 'Member',
};

export default function HomeSidebarProfile() {
  const [profile, setProfile] = useState<ProfileState>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: details }, { data: membership }] = await Promise.all([
        supabase.from('profiles').select('full_name,avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('organization_members').select('role').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle(),
      ]);
      setProfile({ name: details?.full_name || user.email?.split('@')[0] || 'Member', role: membership?.role || 'member', avatarUrl: details?.avatar_url || null });
    });
  }, []);

  if (!profile) return null;
  const initial = profile.name.slice(0, 1).toUpperCase();
  return <div style={{ margin: '12px 0 18px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,.06)' }}>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover' }} /> : <span className="avatar gradient">{initial}</span>}
      <div style={{ minWidth: 0 }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</strong><small>{roleLabel[profile.role] || profile.role}</small></div>
    </div>
    <Link className="nav-item" href="/me" style={{ display: 'block', marginTop: '10px' }}>My page</Link>
  </div>;
}
