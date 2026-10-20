import type { Court, RecruitStatus } from '../types'

export const hhmm = (time: string) => time.slice(0, 5)

export const STATUS_STYLES: Record<RecruitStatus, string> = {
  선착순모집: 'bg-green-100 text-green-800',
  호스트지정: 'bg-blue-100 text-blue-800',
  양도: 'bg-amber-100 text-amber-800',
  인증코트: 'bg-purple-100 text-purple-800',
}

// 종료 시간이 지난 일정 (24:00 종료는 당일 끝까지 진행 중)
export const isPast = (court: Court, date: string, time: string) =>
  court.play_date < date || (court.play_date === date && court.end_time <= time)
