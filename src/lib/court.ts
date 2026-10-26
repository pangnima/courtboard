import type { Court, RecruitStatus } from '../types'

export const hhmm = (time: string) => time.slice(0, 5)

export const STATUS_STYLES: Record<RecruitStatus, string> = {
  선착순모집: 'bg-green-100 text-green-800',
  호스트지정: 'bg-blue-100 text-blue-800',
  양도: 'bg-amber-100 text-amber-800',
  인증코트: 'bg-purple-100 text-purple-800',
}

// 취소수수료 = 이용금액 × 요율. 코트별 요율이 다르면 CANCEL_FEE_RATES에 추가 (예: 야뚜라미: 0.2)
const DEFAULT_CANCEL_FEE_RATE = 0.1
const CANCEL_FEE_RATES: Partial<Record<string, number>> = {}

export const cancelFee = (court: Court) =>
  Math.round(court.price * (CANCEL_FEE_RATES[court.court_name] ?? DEFAULT_CANCEL_FEE_RATE))

// 완료(외부에서 확정) 일정의 코트 이름 옆 배지
export const DONE_BADGE = 'shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white no-underline'

// 이 기능 도입 시점에 이미 있던 일정(40건)을 '최근 등록'에서 빼기 위한 기준 시각.
// 2026-10-21 오후 이후에는 24시간 조건만으로 충분하므로 제거해도 된다.
const RECENT_SINCE = Date.parse('2026-10-20T04:05:57Z')
const DAY_MS = 24 * 60 * 60 * 1000

export function isRecent(court: Court) {
  const created = Date.parse(court.created_at)
  return created > RECENT_SINCE && Date.now() - created < DAY_MS
}

// 종료 시간이 지난 일정 (24:00 종료는 당일 끝까지 진행 중)
export const isPast = (court: Court, date: string, time: string) =>
  court.play_date < date || (court.play_date === date && court.end_time <= time)
