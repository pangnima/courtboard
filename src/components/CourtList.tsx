import { Fragment, useState } from 'react'
import { hhmm, isPast, STATUS_STYLES } from '../lib/court'
import { formatDateLabel, nowTime, today } from '../lib/date'
import { supabase } from '../lib/supabase'
import type { Court } from '../types'

type Props = {
  courts: Court[]
  isAdmin: boolean
  onChanged: () => void
}

const MEMO_MAX = 200

// 이미 일자순으로 정렬된 목록을 연속된 같은 날짜끼리 묶는다
function groupByDate(courts: Court[]) {
  const groups: { date: string; items: Court[] }[] = []
  for (const court of courts) {
    const last = groups.at(-1)
    if (last?.date === court.play_date) last.items.push(court)
    else groups.push({ date: court.play_date, items: [court] })
  }
  return groups
}

// 날짜 카드마다 표가 따로라서 같은 열 너비를 써서 세로 정렬을 맞춘다
function Columns({ isAdmin }: { isAdmin: boolean }) {
  return (
    <colgroup>
      <col className="w-32" />
      <col />
      <col className="w-24" />
      <col className="w-24" />
      <col className="w-28" />
      <col className="w-28" />
      {isAdmin && <col className="w-28" />}
    </colgroup>
  )
}

export default function CourtList({ courts, isAdmin, onChanged }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [savingMemo, setSavingMemo] = useState(false)

  async function handleDelete(court: Court) {
    if (!confirm(`'${court.court_name} ${court.court_number}' (${court.play_date}) 항목을 삭제할까요?`)) return

    // RLS 때문에 관리자가 아니면 error 없이 0행이 삭제되므로 select()로 결과 행을 확인
    const { data, error } = await supabase.from('courts').delete().eq('id', court.id).select()
    if (error) return alert(`삭제 실패: ${error.message}`)
    if (!data.length) return alert('삭제 권한이 없습니다.')
    onChanged()
  }

  function startEdit(court: Court) {
    setEditingId(court.id)
    setDraft(court.court_notes?.memo ?? '')
  }

  async function saveMemo(courtId: number) {
    const memo = draft.trim()
    setSavingMemo(true)
    const { error } = memo
      ? await supabase.from('court_notes').upsert({ court_id: courtId, memo, updated_at: new Date().toISOString() })
      : await supabase.from('court_notes').delete().eq('court_id', courtId)
    setSavingMemo(false)
    if (error) return alert(`메모 저장 실패: ${error.message}`)
    setEditingId(null)
    onChanged()
  }

  if (!courts.length) return <p className="py-8 text-center text-gray-500">등록된 코트 정보가 없습니다.</p>

  const columnCount = isAdmin ? 7 : 6
  const currentDate = today()
  const currentTime = nowTime()

  return (
    // 좁은 화면에서는 줄바꿈 대신 머리글과 카드가 함께 가로 스크롤
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] gap-4 whitespace-nowrap text-[15px]">
        <table className="w-full table-fixed text-left text-[13px] text-gray-500">
          <Columns isAdmin={isAdmin} />
          <thead>
            <tr>
              <th className="px-4 font-medium">시간</th>
              <th className="px-4 font-medium">코트 이름</th>
              <th className="px-4 font-medium">코트 번호</th>
              <th className="px-4 font-medium">예약자</th>
              <th className="px-4 font-medium">모집 상태</th>
              <th className="px-4 text-right font-medium">비용</th>
              {isAdmin && <th />}
            </tr>
          </thead>
        </table>

        {groupByDate(courts).map(({ date, items }) => {
          const isToday = date === currentDate
          const pastDate = date < currentDate
          const cardClass = isToday
            ? 'border-yellow-400 ring-2 ring-yellow-200'
            : pastDate
              ? 'border-gray-300 opacity-70'
              : 'border-gray-300'
          const headerClass = isToday
            ? 'border-yellow-300 bg-yellow-50 text-yellow-900'
            : pastDate
              ? 'border-gray-300 bg-gray-100 text-gray-400'
              : 'border-gray-300 bg-slate-50 text-gray-900'

          return (
            <section key={date} className={`overflow-hidden rounded-xl border bg-white shadow-sm ${cardClass}`}>
              <header className={`flex items-center gap-2 border-b px-4 py-3 ${headerClass}`}>
                <h3 className="text-base font-bold">{formatDateLabel(date)}</h3>
                {isToday && (
                  <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900">오늘</span>
                )}
                {pastDate && <span className="text-xs">지난 일정</span>}
                <span className="ml-auto text-sm font-medium opacity-70">{items.length}건</span>
              </header>

              <table className="w-full table-fixed">
                <Columns isAdmin={isAdmin} />
                <tbody>
                  {items.map((court, index) => {
                    const memo = court.court_notes?.memo
                    const editing = editingId === court.id
                    const past = isPast(court, currentDate, currentTime)
                    const rowClass = past ? 'text-gray-400' : 'text-gray-900'
                    const divider = index > 0 ? 'border-t border-gray-200' : ''
                    return (
                      <Fragment key={court.id}>
                        <tr className={`${divider} ${rowClass}`} aria-disabled={past}>
                          <td className="px-4 py-3 font-semibold tabular-nums">
                            {hhmm(court.start_time)} ~ {hhmm(court.end_time)}
                          </td>
                          <td className="truncate px-4 py-3 font-medium" title={court.court_name}>
                            {court.court_name}
                          </td>
                          <td className="truncate px-4 py-3">{court.court_number}</td>
                          <td className="truncate px-4 py-3">{court.reserver_name}</td>
                          <td className="px-4 py-3">
                            {past ? (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">마감</span>
                            ) : (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[court.recruit_status]}`}>
                                {court.recruit_status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{court.price.toLocaleString()}원</td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right text-sm">
                              <button onClick={() => startEdit(court)} className="mr-3 text-gray-600 hover:underline">
                                메모
                              </button>
                              <button onClick={() => handleDelete(court)} className="text-red-600 hover:underline">
                                삭제
                              </button>
                            </td>
                          )}
                        </tr>
                        {editing ? (
                          <tr>
                            <td colSpan={columnCount} className="whitespace-normal px-4 pb-4">
                              <div className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                <label htmlFor={`memo-${court.id}`} className="text-xs font-medium text-gray-600">
                                  관리자 메모
                                </label>
                                <textarea
                                  id={`memo-${court.id}`}
                                  autoFocus
                                  rows={3}
                                  maxLength={MEMO_MAX}
                                  placeholder="예: OOO에게 양도"
                                  className="w-full resize-y rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
                                  value={draft}
                                  onChange={(e) => setDraft(e.target.value)}
                                />
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs text-gray-500">
                                    {draft.length}/{MEMO_MAX} · 비우면 메모 삭제
                                  </span>
                                  <div className="flex gap-2 text-sm">
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="rounded border border-gray-300 bg-white px-4 py-1.5 text-gray-700"
                                    >
                                      취소
                                    </button>
                                    <button
                                      onClick={() => saveMemo(court.id)}
                                      disabled={savingMemo}
                                      className="rounded bg-gray-800 px-4 py-1.5 text-white disabled:opacity-50"
                                    >
                                      {savingMemo ? '저장 중…' : '저장'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          memo && (
                            <tr>
                              <td colSpan={columnCount} className="whitespace-normal px-4 pb-3">
                                <p className="rounded-md bg-gray-50 px-3 py-2 text-[13px] text-gray-600">📝 {memo}</p>
                              </td>
                            </tr>
                          )
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )
        })}
      </div>
    </div>
  )
}
