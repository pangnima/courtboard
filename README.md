# 테니스 코트 게시판

Vite + React + TypeScript + Supabase. 누구나 등록, 관리자만 삭제(RLS로 강제).

## 설정
1. Supabase 프로젝트 생성 → SQL Editor에서 `supabase/schema.sql` 실행
2. Authentication > Sign In / Providers에서 **Allow new users to sign up** 끄기
3. 관리자 계정(로그인 아이디 `admin` = 이메일 `admin@tennis.local`) 생성 후 SQL 실행:
   `insert into public.admins (user_id) values ('<user uuid>');`
4. `.env.example`을 `.env.local`로 복사하고 Project URL과 Publishable(anon) key 입력
5. `npm install && npm run dev`

## 배포
Vercel/Netlify에 정적 사이트로 배포하고 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 등록.
