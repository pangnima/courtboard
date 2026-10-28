import { DONE_BADGE, hhmm, isRecent, RECENT_HOURS, STATUS_STYLES } from '../lib/court'
import { formatDateLabel, formatDateTime, timeAgo } from '../lib/date'
import type { Court } from '../types'

// 최근 12시간 이내 등록된 일정 (모두에게 노출, 읽기 전용)
export default function RecentCourts({ courts }: { courts: Court[] }) {
  const recent = courts.filter(isRecent).sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <section className="grid gap-3 rounded-xl border border-sky-300 bg-sky-50 p-4">
      <header className="flex items-center gap-2 text-sky-900">
        <h2 className="text-lg font-bold">최근 {RECENT_HOURS}시간 등록</h2>
        <span className="ml-auto text-sm font-medium opacity-70">{recent.length}건</span>
      </header>

      {recent.length === 0 ? (
        <p className="text-sm text-sky-900/70">최근 {RECENT_HOURS}시간 동안 등록된 일정이 없습니다.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((court) => {
            const failed = court.transfer_failed
            const done = court.completed
            return (
              <li
                key={court.id}
                className={`grid gap-1 rounded-lg border p-3 shadow-sm ${done ? 'border-emerald-300 bg-emerald-50' : 'border-sky-200 bg-white'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-bold ${failed ? 'text-gray-400 line-through decoration-red-400' : ''}`}>
                    {formatDateLabel(court.play_date)}{' '}
                    <span className="tabular-nums">
                      {hhmm(court.start_time)}~{hhmm(court.end_time)}
                    </span>
                  </span>
                  {failed ? (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">양도 실패</span>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[court.recruit_status]}`}>
                      {court.recruit_status}
                    </span>
                  )}
                </div>
                <p className={`flex items-center gap-1.5 font-medium ${failed ? 'text-gray-400 line-through decoration-red-400' : ''}`}>
                  {court.court_name} · {court.court_number}
                  {done && <span className={DONE_BADGE}>완료</span>}
                </p>
                <p className="flex justify-between text-sm text-gray-600">
                  <span>예약자 {court.reserver_name}</span>
                  <span className="tabular-nums">{court.price.toLocaleString()}원</span>
                </p>
                <p className="text-xs text-sky-700">
                  {formatDateTime(court.created_at)} 등록 · {timeAgo(court.created_at)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
