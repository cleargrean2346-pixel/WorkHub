import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd();
const required = [
  ['lib/markdown.ts', 'escapeHtml'],
  ['app/api/health/route.ts', 'database'],
  ['app/api/notifications/email/route.ts', 'timingSafeEqual'],
  ['supabase/migrations/202608040009_account_deactivation.sql', 'deactivate_my_account'],
  ['supabase/migrations/202608040010_email_notification_queue.sql', 'email_notification_queue'],
  ['supabase/migrations/202608040013_protected_url_access_audit.sql', 'protected_url_denied'],
  ['vercel.json', '/api/notifications/email'],
];
for (const [path, text] of required) { const full = resolve(root, path); if (!existsSync(full) || !readFileSync(full, 'utf8').includes(text)) throw new Error(`검증 실패: ${path}`); }
console.log(`WorkHub smoke verification passed (${required.length} checks).`);
