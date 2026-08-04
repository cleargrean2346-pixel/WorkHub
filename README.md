# WorkHub

조직의 게시글, 문서, 업무, 승인 절차를 관리하는 Next.js + Supabase 기반 협업 서비스입니다.

## 로컬 실행

```powershell
npm.cmd install
npm.cmd run dev
```

프로덕션 빌드 검증은 다음 명령으로 실행합니다.

```powershell
npm.cmd run build
```

## Supabase 설정

1. Supabase 프로젝트에서 **SQL Editor → New query**를 엽니다.
2. `supabase/migrations`의 SQL 파일을 번호 순서대로 실행합니다.
3. 특히 최근 기능에는 다음 마이그레이션이 필요합니다.

| 파일 | 기능 |
| --- | --- |
| `202608040007_post_image_uploads.sql` | 게시글 이미지 업로드 |
| `202608040008_document_metadata_versions.sql` | 문서 변경 이력 |
| `202608040009_account_deactivation.sql` | 본인 계정 비활성화 |
| `202608040010_email_notification_queue.sql` | 이메일 알림 대기열 |
| `202608040011_ai_connection_status.sql` | AI 연결 테스트 시간 |
| `202608040012_data_deletion_requests.sql` | 데이터 삭제·익명화 요청 |
| `202608040013_protected_url_access_audit.sql` | 보호 URL 접근 감사 로그 |

Supabase **Authentication → URL Configuration**에는 Vercel 배포 주소와 `http://localhost:3000`을 Redirect URL로 등록합니다. Google OAuth의 승인된 리디렉션 URI는 다음 주소입니다.

```text
https://wfitoyzhsjauiyiaglrl.supabase.co/auth/v1/callback
```

## Vercel 환경 변수

| 이름 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 이메일 대기열 처리용 서버 전용 키 |
| `AI_ENCRYPTION_SECRET` | 개인 AI API 키 암호화용 32자 이상 비밀값 |
| `RESEND_API_KEY` | Resend 이메일 발송 API 키 (선택) |
| `EMAIL_FROM` | 인증된 발신자. 예: `WorkHub <noreply@도메인>` |
| `CRON_SECRET` | 이메일 발송 Cron 보호용 긴 임의 문자열 |

`SUPABASE_SERVICE_ROLE_KEY`, `AI_ENCRYPTION_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`은 절대 브라우저 변수(`NEXT_PUBLIC_`)나 GitHub에 넣지 마세요.

`vercel.json`은 매일 오전 9시(UTC)에 이메일 대기열을 처리합니다. Vercel과 프로젝트 환경 변수에 같은 `CRON_SECRET`을 설정해야 합니다.

## Google 로그인

1. Google Cloud Console에서 OAuth 2.0 웹 클라이언트를 만듭니다.
2. Supabase **Authentication → Providers → Google**에 Client ID와 Client Secret을 저장합니다.
3. Supabase URL Configuration에 현재 배포 주소의 `/auth/callback`을 추가합니다.

새 로그인 계정은 승인 대기로 생성되며, 관리자 대시보드의 **승인 대기**에서 처리합니다.
