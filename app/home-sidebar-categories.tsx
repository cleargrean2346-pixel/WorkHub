'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Category = { id: string; name: string };

export default function HomeSidebarCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'approved').limit(1).maybeSingle();
      if (!membership) return;
      const [{ data: settings }, { data: categoryRows }] = await Promise.all([
        supabase.from('site_settings').select('home_category_ids').eq('id', true).maybeSingle(),
        supabase.from('categories').select('id,name').eq('organization_id', membership.organization_id).order('name'),
      ]);
      const ids = settings?.home_category_ids ?? [];
      setCategories((categoryRows ?? []).filter((category) => ids.includes(category.id)));
    });
  }, []);

  if (!categories.length) return null;
  return <><p className="nav-label second">CATEGORIES</p>{categories.map((category) => <Link className="nav-item" href={`/posts?category=${category.id}`} key={category.id}>{category.name}</Link>)}</>;
}
