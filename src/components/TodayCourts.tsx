import { hhmm, isPast, STATUS_STYLES } from '../lib/court'
import { formatDateLabel, nowTime, today } from '../lib/date'
import type { Court } from '../types'

// 페이지 맨 위 오늘 일정 요약 (읽기 전용, 관리 기능은 아래 목록에서)
export default function TodayCourts({ courts }: { courts: Court[] }) {
  const currentDate = today()
  const currentTime = nowTime()
  const todays = courts
    .filter((court) => court.play_date === currentDate)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <section className="grid gap-3 rounded-xl border border-yellow-400 bg-yellow-50 p-4 ring-2 ring-yellow-200">
      <header className="flex items-center gap-2 text-yellow-900">
        <h2 className="text-lg font-bold">오늘의 코트</h2>
        <span className="text-sm">{formatDateLabel(currentDate)}</span>
        <span className="ml-auto text-sm font-medium opacity-70">{todays.length}건</span>
      </header>

      {todays.length === 0 ? (
        <p className="py-2 text-sm text-yellow-900/70">오늘 등록된 코트가 없습니다.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {todays.map((court) => {
            const past = isPast(court, currentDate, currentTime)
            return (
              <li
                key={court.id}
                aria-disabled={past}
                className={`grid gap-1 rounded-lg border border-yellow-200 bg-white p-3 shadow-sm ${past ? 'text-gray-400' : 'text-gray-900'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold tabular-nums">
                    {hhmm(court.start_time)} ~ {hhmm(court.end_time)}
                  </span>
                  {past ? (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">마감</span>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[court.recruit_status]}`}>
                      {court.recruit_status}
                    </span>
                  )}
                </div>
                <p className="font-medium">
                  {court.court_name} · {court.court_number}
                </p>
                <p className={`flex justify-between text-sm ${past ? '' : 'text-gray-600'}`}>
                  <span>예약자 {court.reserver_name}</span>
                  <span className="tabular-nums">{court.price.toLocaleString()}원</span>
                </p>
                {court.court_notes?.memo && (
                  <p className="mt-1 rounded-md bg-gray-50 px-2 py-1 text-[13px] text-gray-600">📝 {court.court_notes.memo}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
