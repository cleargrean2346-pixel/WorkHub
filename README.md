# WorkHub

Next.js와 Supabase로 구축하는 조직형 업무·지식 관리 플랫폼입니다.

## 로컬 실행

```powershell
npm.cmd install
npm.cmd run dev
```

## Supabase 설정

1. Supabase Dashboard에서 **SQL Editor** → **New query**를 엽니다.
2. [`supabase/migrations/202607290001_initial_workhub.sql`](./supabase/migrations/202607290001_initial_workhub.sql)의 내용을 모두 붙여넣고 **Run**을 누릅니다.
3. **Authentication** → **URL Configuration**의 Site URL에 배포 주소를 넣습니다. 로컬 개발에는 `http://localhost:3000`을 Redirect URL에 추가합니다.

## Vercel 환경 변수

Vercel Project → Settings → Environment Variables에 아래 값을 추가합니다.

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wfitoyzhsjauiyiaglrl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase의 anon/publishable key |

`service_role` 키와 데이터베이스 비밀번호는 Vercel 또는 GitHub에 넣지 마세요.

## Google 로그인 설정

1. Google Cloud Console에서 OAuth 2.0 Web Client를 만들고, Authorized redirect URI로 `https://wfitoyzhsjauiyiaglrl.supabase.co/auth/v1/callback`을 추가합니다.
2. Supabase **Authentication → Providers → Google**에서 Provider를 켜고 Google Client ID와 Client Secret을 직접 입력합니다.
3. Supabase **Authentication → URL Configuration**의 Redirect URLs에 `https://work-2go6ymryn-jun-hui.vercel.app/auth/callback`을 추가합니다.
