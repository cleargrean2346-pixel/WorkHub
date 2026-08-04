import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { saveNotificationPreferences } from './actions';
import BrowserNotificationControl from './browser-notification-control';

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: preferences } = await supabase.from('user_notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
  return <main className="onboarding"><section className="onboarding-card">
    <Link className="brand" href="/workspace"><span className="brand-mark">W</span><span>workhub</span></Link>
    <p className="eyebrow"><span /> SETTINGS</p><h1>Notification preferences</h1><p>Choose which updates should appear in WorkHub. Email delivery depends on your workspace email configuration.</p>
    <form action={saveNotificationPreferences}>
      <fieldset><legend>Delivery</legend><label><input type="checkbox" name="inAppEnabled" defaultChecked={preferences?.in_app_enabled ?? true}/> In-app notifications</label><label><input type="checkbox" name="emailEnabled" defaultChecked={preferences?.email_enabled ?? false}/> Email notifications</label></fieldset>
      <fieldset><legend>Notify me about</legend><label><input type="checkbox" name="memberUpdates" defaultChecked={preferences?.member_updates ?? true}/> Member updates</label><label><input type="checkbox" name="commentUpdates" defaultChecked={preferences?.comment_updates ?? true}/> Comment updates</label><label><input type="checkbox" name="taskUpdates" defaultChecked={preferences?.task_updates ?? true}/> Task updates</label><label><input type="checkbox" name="requestUpdates" defaultChecked={preferences?.request_updates ?? true}/> Request updates</label></fieldset>
      <fieldset><legend>Quiet hours (optional)</legend><label>Start<input name="quietStart" type="time" defaultValue={preferences?.quiet_hours_start ?? ''}/></label><label>End<input name="quietEnd" type="time" defaultValue={preferences?.quiet_hours_end ?? ''}/></label></fieldset>
      <BrowserNotificationControl />
      <button className="primary">Save preferences</button>
    </form>
    <Link className="back-link" href="/notifications">Back to notifications</Link>
  </section></main>;
}
