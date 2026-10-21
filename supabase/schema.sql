-- Supabase 대시보드 > SQL Editor에서 한 번 실행 (현재 DB 상태 기준)
create table public.courts (
  id             bigint generated always as identity primary key,
  court_name     text not null check (char_length(court_name) between 1 and 50),
  court_number   text not null check (char_length(court_number) between 1 and 20),
  reserver_name  text not null check (char_length(reserver_name) between 1 and 20),
  recruit_status text not null default '선착순모집'
                 check (recruit_status in ('선착순모집', '호스트지정', '양도', '인증코트')),
  play_date      date not null,
  start_time     time not null,
  end_time       time not null, -- 클라이언트가 시작 + 2시간으로 저장
  price          integer not null check (price >= 0),
  transfer_failed boolean not null default false, -- 관리자만 변경
  completed      boolean not null default false,  -- 외부에서 확정된 일정, 관리자만 변경
  admin_checked_at timestamptz,                   -- 관리자 확인 시각 (null = 미확인), 관리자만 변경
  created_at     timestamptz not null default now(),
  check (end_time > start_time),
  constraint courts_completed_or_failed check (not (completed and transfer_failed)), -- 완료와 양도 실패는 동시 불가
  constraint courts_start_on_the_hour
    check (extract(minute from start_time) = 0 and extract(second from start_time) = 0)
);

-- 관리자 메모 (모두 조회, 관리자만 작성)
create table public.court_notes (
  court_id   bigint primary key references public.courts(id) on delete cascade,
  memo       text not null check (char_length(memo) <= 200),
  updated_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- 로그인 사용자만 호출 가능 (익명은 항상 false이므로 불필요)
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.courts enable row level security;
alter table public.court_notes enable row level security;
alter table public.admins enable row level security; -- 정책 없음 = 클라이언트 접근 불가

create policy "누구나 조회" on public.courts
  for select to anon, authenticated using (true);
create policy "누구나 등록" on public.courts
  for insert to anon, authenticated with check (transfer_failed = false and completed = false and admin_checked_at is null);
create policy "관리자만 삭제" on public.courts
  for delete to authenticated using ((select public.is_admin()));

-- 수정은 관리자의 양도 실패/완료 표시, 새 일정 확인, 모집 상태 변경만 허용 (다른 컬럼은 수정 불가)
revoke update on public.courts from anon, authenticated;
grant update (transfer_failed, completed, admin_checked_at, recruit_status) on public.courts to authenticated;
create policy "관리자만 상태 변경" on public.courts
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "누구나 메모 조회" on public.court_notes
  for select to anon, authenticated using (true);
create policy "관리자만 메모 작성" on public.court_notes
  for insert to authenticated with check ((select public.is_admin()));
create policy "관리자만 메모 수정" on public.court_notes
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "관리자만 메모 삭제" on public.court_notes
  for delete to authenticated using ((select public.is_admin()));

-- 관리자 지정: Authentication > Users에서 계정 생성 후 UUID로 실행
-- insert into public.admins (user_id) values ('<user uuid>');
