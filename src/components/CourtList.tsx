import { Fragment, useState } from 'react'
import { DONE_BADGE, hhmm, isPast, STATUS_STYLES } from '../lib/court'
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
      {isAdmin && <col className="w-56" />}
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

  async function toggleTransferFailed(court: Court) {
    const failed = !court.transfer_failed
    const label = `'${court.court_name} ${court.court_number}' (${court.play_date})`
    if (!confirm(failed ? `${label} 일정을 양도 실패로 표시할까요?` : `${label} 일정의 양도 실패를 취소할까요?`)) return

    // 삭제와 마찬가지로 권한이 없으면 error 없이 0행이 바뀌므로 결과 행을 확인
    // 완료와 양도 실패는 동시에 표시할 수 없으므로 실패 표시 시 완료를 해제
    const changes = failed ? { transfer_failed: true, completed: false } : { transfer_failed: false }
    const { data, error } = await supabase.from('courts').update(changes).eq('id', court.id).select()
    if (error) return alert(`변경 실패: ${error.message}`)
    if (!data.length) return alert('변경 권한이 없습니다.')
    onChanged()
  }

  async function toggleCompleted(court: Court) {
    const completed = !court.completed
    const label = `'${court.court_name} ${court.court_number}' (${court.play_date})`
    if (!confirm(completed ? `${label} 일정을 완료로 표시할까요?` : `${label} 일정의 완료를 취소할까요?`)) return

    const changes = completed ? { completed: true, transfer_failed: false } : { completed: false }
    const { data, error } = await supabase.from('courts').update(changes).eq('id', court.id).select()
    if (error) return alert(`변경 실패: ${error.message}`)
    if (!data.length) return alert('변경 권한이 없습니다.')
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

  // 다가오는 일정은 가까운 날짜부터, 지난 일정과 양도 실패는 최근 날짜부터 (같은 날은 시작 시간 순)
  // 양도 실패는 날짜와 상관없이 별도 목록으로 뺀다
  const sorted = [...courts].sort(
    (a, b) => a.play_date.localeCompare(b.play_date) || a.start_time.localeCompare(b.start_time),
  )
  const groups = groupByDate(sorted.filter((court) => !court.transfer_failed))
  const upcoming = groups.filter((group) => group.date >= currentDate)
  const past = groups.filter((group) => group.date < currentDate).reverse()
  const failed = groupByDate(sorted.filter((court) => court.transfer_failed)).reverse()
  const countItems = (list: typeof groups) => list.reduce((sum, group) => sum + group.items.length, 0)

  const renderGroup = ({ date, items }: { date: string; items: Court[] }) => {
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
              const isFailed = court.transfer_failed
              const isDone = court.completed
              // 완료는 흐리게 하지 않고 배경색으로 구분 (메모 행까지 같은 색)
              const rowBg = isDone ? 'bg-emerald-50' : ''
              const rowClass = isFailed
                ? 'text-gray-400 line-through decoration-red-400'
                : isDone
                  ? 'text-gray-900'
                  : past
                    ? 'text-gray-400'
                    : 'text-gray-900'
              const divider = index > 0 ? 'border-t border-gray-200' : ''
              return (
                <Fragment key={court.id}>
                  <tr className={`${divider} ${rowBg} ${rowClass}`}>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {hhmm(court.start_time)} ~ {hhmm(court.end_time)}
                    </td>
                    <td className="px-4 py-3 font-medium" title={court.court_name}>
                      <span className="flex items-center gap-1.5">
                        <span className="truncate">{court.court_name}</span>
                        {isDone && <span className={DONE_BADGE}>완료</span>}
                      </span>
                    </td>
                    <td className="truncate px-4 py-3">{court.court_number}</td>
                    <td className="truncate px-4 py-3">{court.reserver_name}</td>
                    <td className="px-4 py-3">
                      {isFailed ? (
                        <span className="inline-block rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 no-underline">
                          양도 실패
                        </span>
                      ) : past ? (
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
                        <button
                          onClick={() => toggleCompleted(court)}
                          className={`mr-3 hover:underline ${isDone ? 'text-blue-600' : 'text-emerald-700'}`}
                        >
                          {isDone ? '완료취소' : '완료'}
                        </button>
                        <button
                          onClick={() => toggleTransferFailed(court)}
                          className={`mr-3 hover:underline ${isFailed ? 'text-blue-600' : 'text-amber-700'}`}
                        >
                          {isFailed ? '실패취소' : '양도실패'}
                        </button>
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
                    <tr className={rowBg}>
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
                      <tr className={rowBg}>
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
  }

  // 기본으로 접혀 있는 하단 목록 (양도 실패, 지난 일정). 비어 있으면 표시하지 않는다
  const renderCollapsible = (label: string, list: typeof groups) =>
    list.length > 0 && (
      <details className="group grid gap-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-200 [&::-webkit-details-marker]:hidden">
          <span className="transition-transform group-open:rotate-90">▶</span>
          {label}
          <span className="font-normal text-gray-500">· {countItems(list)}건</span>
          <span className="ml-auto text-xs font-normal text-gray-500 group-open:hidden">펼치기</span>
        </summary>
        <div className="mt-4 grid gap-4">{list.map(renderGroup)}</div>
      </details>
    )

  return (
    // 좁은 화면에서는 줄바꿈 대신 머리글과 카드가 함께 가로 스크롤
    <div className="overflow-x-auto">
      <div className={`grid gap-4 whitespace-nowrap text-[15px] ${isAdmin ? 'min-w-[920px]' : 'min-w-[720px]'}`}>
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

        <p className="flex items-center gap-2 px-1 text-sm font-semibold text-gray-700">
          다가오는 일정<span className="font-normal text-gray-500">· {countItems(upcoming)}건</span>
        </p>
        {upcoming.length ? (
          upcoming.map(renderGroup)
        ) : (
          <p className="rounded-xl border border-dashed border-gray-300 py-8 text-center text-gray-500">
            다가오는 일정이 없습니다.
          </p>
        )}

        {renderCollapsible('양도 실패', failed)}
        {renderCollapsible('지난 일정', past)}
      </div>
    </div>
  )
}
