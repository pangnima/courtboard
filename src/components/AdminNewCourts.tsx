import { useState } from 'react'
import { hhmm } from '../lib/court'
import { formatDateLabel, timeAgo } from '../lib/date'
import { supabase } from '../lib/supabase'
import type { Court } from '../types'

type Props = {
  courts: Court[]
  onChanged: () => void
}

// 관리자 전용: 아직 확인하지 않은 새 일정 알림. 확인하면 이 알림에서만 사라진다
export default function AdminNewCourts({ courts, onChanged }: Props) {
  const [saving, setSaving] = useState(false)
  const unchecked = courts
    .filter((court) => court.admin_checked_at === null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  if (!unchecked.length) return null

  async function check(ids: number[]) {
    setSaving(true)
    // 권한이 없으면 error 없이 0행이 바뀌므로 결과 행을 확인
    const { data, error } = await supabase
      .from('courts')
      .update({ admin_checked_at: new Date().toISOString() })
      .in('id', ids)
      .select()
    setSaving(false)
    if (error) return alert(`확인 처리 실패: ${error.message}`)
    if (!data.length) return alert('확인 권한이 없습니다.')
    onChanged()
  }

  return (
    <section className="grid gap-3 rounded-xl border border-orange-300 bg-orange-50 p-4" role="status">
      <header className="flex flex-wrap items-center gap-2 text-orange-900">
        <h2 className="font-bold">🔔 새로운 일정이 {unchecked.length}건 등록되었습니다. 확인해주세요.</h2>
        {unchecked.length > 1 && (
          <button
            onClick={() => check(unchecked.map((court) => court.id))}
            disabled={saving}
            className="ml-auto rounded bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            모두 확인
          </button>
        )}
      </header>
      <ul className="grid divide-y divide-orange-200 rounded-lg border border-orange-200 bg-white">
        {unchecked.map((court) => (
          <li key={court.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
            <span className="font-semibold">
              {formatDateLabel(court.play_date)} <span className="tabular-nums">{hhmm(court.start_time)}~{hhmm(court.end_time)}</span>
            </span>
            <span>
              {court.court_name} {court.court_number}
            </span>
            <span className="text-gray-600">{court.reserver_name}</span>
            <span className="text-gray-600">{court.recruit_status}</span>
            <span className="text-xs text-gray-500">{timeAgo(court.created_at)} 등록</span>
            <button
              onClick={() => check([court.id])}
              disabled={saving}
              className="ml-auto rounded border border-orange-300 px-3 py-1 text-orange-800 hover:bg-orange-100 disabled:opacity-50"
            >
              확인
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
